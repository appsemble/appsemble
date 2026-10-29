import { type IdentifiableBlock } from '@appsemble/lang-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockManifestCacher } from './BlockManifestCacher.js';
import { type Logger } from '../../Logger.js';

const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger;

const markdown: IdentifiableBlock = { type: 'markdown', version: '1.2.3' };
const markdownUrl = 'https://blocks.example.com/api/blocks/@appsemble/markdown/versions/1.2.3';

function headers(retryAfter?: string): { get: (name: string) => string | null } {
  return { get: (name) => (name.toLowerCase() === 'retry-after' ? (retryAfter ?? null) : null) };
}

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: headers(),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function statusResponse(status: number, retryAfter?: string): Response {
  return {
    ok: false,
    status,
    headers: headers(retryAfter),
    json: () => Promise.resolve(null),
  } as unknown as Response;
}

/**
 * Read the block manifest URL a single-block lookup resolves to.
 *
 * @param fetchMock The stubbed global `fetch`.
 * @returns The URL string passed to `fetch`.
 */
function fetchedUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return String(fetchMock.mock.calls[0][0]);
}

describe('BlockManifestCacher', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('resolves a block manifest to the normalized block versions endpoint', async () => {
    fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger);

    const [manifest] = await cacher.getCachedBlockVersions([markdown]);

    expect(manifest).toStrictEqual({ name: '@appsemble/markdown' });
    expect(fetchedUrl(fetchMock)).toBe(markdownUrl);
  });

  it('fetches a given block only once across repeated lookups', async () => {
    fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger);

    await cacher.getCachedBlockVersions([markdown]);
    await cacher.getCachedBlockVersions([markdown]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not cache a missing block, so it can be retried later', async () => {
    fetchMock.mockResolvedValueOnce(statusResponse(404));
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger, { maxRetries: 0 });

    const first = await cacher.getCachedBlockVersions([markdown]);
    expect(first).toStrictEqual([]);
    expect(cacher.blocks.has(markdownUrl)).toBe(false);

    fetchMock.mockResolvedValueOnce(okResponse({ name: '@appsemble/markdown' }));
    const [manifest] = await cacher.getCachedBlockVersions([markdown]);

    expect(manifest).toStrictEqual({ name: '@appsemble/markdown' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a client error such as 404', async () => {
    fetchMock.mockResolvedValue(statusResponse(404));
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger, { maxRetries: 3 });

    const result = await cacher.getCachedBlockVersions([markdown]);

    expect(result).toStrictEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps other blocks when one block fails to fetch', async () => {
    const failing: IdentifiableBlock = { type: 'unreachable', version: '1.0.0' };
    fetchMock.mockImplementation((url: string) =>
      url.includes('markdown')
        ? Promise.resolve(okResponse({ name: '@appsemble/markdown' }))
        : Promise.reject(new Error('fetch failed')),
    );
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger, { maxRetries: 0 });

    const manifests = await cacher.getCachedBlockVersions([markdown, failing]);

    expect(manifests).toStrictEqual([{ name: '@appsemble/markdown' }]);
  });

  describe('Appsemble URL', () => {
    it('normalizes a trailing slash off the configured base URL', async () => {
      fetchMock.mockResolvedValue(okResponse({}));
      const cacher = new BlockManifestCacher('https://blocks.example.com/', logger);

      await cacher.getCachedBlockVersions([markdown]);

      expect(fetchedUrl(fetchMock)).toBe(markdownUrl);
    });

    it('fetches manifests from the newly configured Appsemble URL', async () => {
      fetchMock.mockResolvedValue(okResponse({}));
      const cacher = new BlockManifestCacher('https://old.example.com', logger);

      cacher.apiUrl = 'https://new.example.com';

      expect(cacher.apiUrl).toBe('https://new.example.com');

      await cacher.getCachedBlockVersions([markdown]);

      expect(fetchedUrl(fetchMock)).toBe(
        'https://new.example.com/api/blocks/@appsemble/markdown/versions/1.2.3',
      );
    });
  });

  describe('retry and rate limiting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('retries a rate limited request and returns the manifest once it succeeds', async () => {
      fetchMock
        .mockResolvedValueOnce(statusResponse(429))
        .mockResolvedValueOnce(okResponse({ name: '@appsemble/markdown' }));
      const cacher = new BlockManifestCacher('https://blocks.example.com', logger, {
        maxRetries: 3,
        baseRetryDelayMs: 100,
      });

      const pending = cacher.getCachedBlockVersions([markdown]);
      await vi.advanceTimersByTimeAsync(100);
      const [manifest] = await pending;

      expect(manifest).toStrictEqual({ name: '@appsemble/markdown' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('waits for the server provided Retry-After before retrying', async () => {
      fetchMock
        .mockResolvedValueOnce(statusResponse(429, '1'))
        .mockResolvedValueOnce(okResponse({ name: '@appsemble/markdown' }));
      const cacher = new BlockManifestCacher('https://blocks.example.com', logger, {
        maxRetries: 3,
        baseRetryDelayMs: 100,
      });

      const pending = cacher.getCachedBlockVersions([markdown]);

      // The base delay (100ms) has elapsed, but Retry-After asks for a full second.
      await vi.advanceTimersByTimeAsync(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(800);
      const [manifest] = await pending;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(manifest).toStrictEqual({ name: '@appsemble/markdown' });
    });

    it('gives up after exhausting retries and leaves the block retryable', async () => {
      fetchMock.mockResolvedValue(statusResponse(429));
      const cacher = new BlockManifestCacher('https://blocks.example.com', logger, {
        maxRetries: 2,
        baseRetryDelayMs: 100,
      });

      const pending = cacher.getCachedBlockVersions([markdown]);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await pending;

      expect(result).toStrictEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(cacher.blocks.has(markdownUrl)).toBe(false);
    });
  });
});
