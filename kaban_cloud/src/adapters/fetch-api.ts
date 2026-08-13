import type { BaseCard, Column, DataAdapter } from '../core/types';
import { NetworkError, ValidationError, retryAsync, type RetryOptions } from '../core/utils/retry';

export interface FetchApiAdapterOptions {
  /** Base URL of the API, e.g. `https://api.example.com`. No trailing slash. */
  baseUrl: string;
  /** Extra headers sent with every request (auth token, tenant id, ...). */
  headers?: HeadersInit | (() => HeadersInit);
  /** Override fetch, e.g. to inject retries/telemetry. Defaults to global `fetch`. */
  fetchFn?: typeof fetch;
  /**
   * Retry policy applied to every request via retryAsync. Set to `false` to
   * disable retries entirely (e.g. when the caller wraps calls itself).
   * Defaults to 3 retries with a 1s base delay.
   */
  retry?: RetryOptions | false;
}

async function request<T>(doFetch: typeof fetch, url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await doFetch(url, init);
  } catch (err) {
    // fetch() rejects (TypeError) on network drop, DNS failure, CORS, etc. — always retryable.
    throw new NetworkError(`[FetchApiAdapter] ${init.method ?? 'GET'} ${url} failed: network error`, err);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const message = `[FetchApiAdapter] ${init.method ?? 'GET'} ${url} failed (${res.status}): ${body}`;
    // 4xx (other than 408/429) are the caller's fault and will never succeed on retry.
    if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
      throw new ValidationError(message);
    }
    throw new NetworkError(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * DataAdapter backed by a plain REST API. Expects conventional REST routes:
 *
 *   GET    /columns
 *   GET    /cards
 *   POST   /cards
 *   PATCH  /cards/:id
 *   PATCH  /cards/:id/move   body: { columnId, order }
 *   DELETE /cards/:id
 *
 * Point it at a different route shape by wrapping/extending this factory.
 */
export function createFetchApiAdapter<TCard extends BaseCard = BaseCard>({
  baseUrl,
  headers,
  fetchFn,
  retry,
}: FetchApiAdapterOptions): DataAdapter<TCard> {
  const doFetch = fetchFn ?? fetch;
  const retryOptions = retry === false ? null : retry ?? {};

  const resolveHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(typeof headers === 'function' ? headers() : headers),
  });

  const call = <T>(path: string, init: RequestInit = {}) => {
    const doRequest = () => request<T>(doFetch, `${baseUrl}${path}`, { ...init, headers: { ...resolveHeaders(), ...init.headers } });
    return retryOptions ? retryAsync(doRequest, retryOptions) : doRequest();
  };

  return {
    fetchColumns: () => call<Column[]>('/columns'),

    fetchCards: () => call<TCard[]>('/cards'),

    createCard: (data) => call<TCard>('/cards', { method: 'POST', body: JSON.stringify(data) }),

    updateCard: (id, data) => call<TCard>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    moveCard: (cardId, newColumnId, newOrder) =>
      call<TCard>(`/cards/${cardId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ columnId: newColumnId, order: newOrder }),
      }),

    deleteCard: (id) => call<void>(`/cards/${id}`, { method: 'DELETE' }),
  };
}
