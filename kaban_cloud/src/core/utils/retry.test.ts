import { describe, expect, it, vi } from 'vitest';
import { NetworkError, ValidationError, classifyError, retryAsync } from './retry';

describe('classifyError', () => {
  it('passes through an existing NetworkError/ValidationError unchanged', () => {
    const net = new NetworkError('boom');
    const val = new ValidationError('bad input');
    expect(classifyError(net)).toBe(net);
    expect(classifyError(val)).toBe(val);
  });

  it('classifies a TypeError (fetch network drop) as retryable', () => {
    expect(classifyError(new TypeError('Failed to fetch'))).toBeInstanceOf(NetworkError);
  });

  it('classifies a 4xx status as non-retryable, except 408/429', () => {
    expect(classifyError({ status: 400, message: 'bad' })).toBeInstanceOf(ValidationError);
    expect(classifyError({ status: 404, message: 'not found' })).toBeInstanceOf(ValidationError);
    expect(classifyError({ status: 408, message: 'timeout' })).toBeInstanceOf(NetworkError);
    expect(classifyError({ status: 429, message: 'rate limited' })).toBeInstanceOf(NetworkError);
  });

  it('classifies a 5xx status as retryable', () => {
    expect(classifyError({ status: 503, message: 'unavailable' })).toBeInstanceOf(NetworkError);
  });
});

describe('retryAsync', () => {
  it('returns the result immediately on first success without sleeping', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await retryAsync(fn, { sleep });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries on NetworkError with exponential backoff (1s, 2s, 4s) then succeeds', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError('e1'))
      .mockRejectedValueOnce(new NetworkError('e2'))
      .mockRejectedValueOnce(new NetworkError('e3'))
      .mockResolvedValueOnce('recovered');

    const result = await retryAsync(fn, { maxRetries: 3, baseDelay: 1000, sleep });

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000, 4000]);
  });

  it('gives up after maxRetries and throws the last error', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi.fn().mockRejectedValue(new NetworkError('always fails'));

    await expect(retryAsync(fn, { maxRetries: 2, baseDelay: 10, sleep })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('does not retry a ValidationError', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi.fn().mockRejectedValue(new ValidationError('bad request'));

    await expect(retryAsync(fn, { maxRetries: 3, sleep })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('supports the legacy (fn, maxRetries, baseDelay) call signature', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryAsync(fn, 2, 5);
    expect(result).toBe('ok');
  });

  it('caps delay at maxDelay', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError('e1'))
      .mockRejectedValueOnce(new NetworkError('e2'))
      .mockResolvedValueOnce('ok');

    await retryAsync(fn, { maxRetries: 3, baseDelay: 1000, maxDelay: 1500, sleep });

    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 1500]);
  });
});
