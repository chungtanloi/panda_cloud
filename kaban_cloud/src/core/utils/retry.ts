/**
 * Error thrown by adapter/network calls that are safe to retry
 * (transient failures: network drop, timeout, 5xx, rate limiting).
 */
export class NetworkError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Error thrown for failures that will never succeed on retry
 * (bad input, 4xx other than 429, schema violations). retryAsync
 * gives up immediately when it sees one of these.
 */
export class ValidationError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.cause = cause;
  }
}

/** True for HTTP-style errors that are worth retrying. */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Best-effort classification for errors that didn't already come in as a
 * NetworkError/ValidationError (e.g. a raw fetch() rejection or an adapter
 * that throws a plain Error with an HTTP status attached).
 */
export function classifyError(error: unknown): NetworkError | ValidationError {
  if (error instanceof NetworkError || error instanceof ValidationError) {
    return error;
  }

  const status = (error as { status?: number; statusCode?: number } | null)?.status ??
    (error as { statusCode?: number } | null)?.statusCode;
  const message = error instanceof Error ? error.message : String(error);

  // TypeError is what fetch() rejects with on network drop/CORS/DNS failure.
  if (error instanceof TypeError || /network|fetch failed|timeout|ECONNRESET|ETIMEDOUT/i.test(message)) {
    return new NetworkError(message, error);
  }

  if (typeof status === 'number') {
    return isRetryableStatus(status) ? new NetworkError(message, error) : new ValidationError(message, error);
  }

  // Unknown shape: treat as retryable rather than silently dropping a
  // transient failure into "never retry".
  return new NetworkError(message, error);
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  /** Ceiling for the exponential backoff delay, in ms. Defaults to 30s. */
  maxDelay?: number;
  /** Called before each retry attempt with the attempt number (1-based) and the delay about to be waited. */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
  /** Override the sleep implementation (used by tests). */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn`, retrying on transient (network) failures with exponential
 * backoff: baseDelay, baseDelay*2, baseDelay*4, ... ValidationErrors (and
 * anything classified as non-retryable) are re-thrown immediately.
 *
 *   await retryAsync(() => adapter.moveCard(id, columnId));
 *   await retryAsync(() => adapter.moveCard(id, columnId), { maxRetries: 5, baseDelay: 500 });
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetriesOrOptions: number | RetryOptions = 3,
  baseDelayArg = 1000,
): Promise<T> {
  const options: RetryOptions =
    typeof maxRetriesOrOptions === 'number' ? { maxRetries: maxRetriesOrOptions, baseDelay: baseDelayArg } : maxRetriesOrOptions;

  const maxRetries = options.maxRetries ?? 3;
  const baseDelay = options.baseDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 30_000;
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (rawError) {
      const error = classifyError(rawError);
      lastError = error;

      if (error instanceof ValidationError || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
      options.onRetry?.(attempt + 1, delay, error);
      await sleep(delay);
    }
  }

  // Unreachable, but keeps TypeScript happy about the return type.
  throw lastError;
}
