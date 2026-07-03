import { type IdentifiableBlock } from '@appsemble/lang-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockManifestCacher } from './BlockManifestCacher.js';
import { type Logger } from '../../Logger.js';

const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger;

const markdown: IdentifiableBlock = { type: 'markdown', version: '1.2.3' };

function okResponse(body: unknown): Response {
  return { ok: true, json: () => Promise.resolve(body) } as unknown as Response;
}

function notOkResponse(): Response {
  return { ok: false, json: () => Promise.resolve(null) } as unknown as Response;
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
    expect(fetchedUrl(fetchMock)).toBe(
      'https://blocks.example.com/api/blocks/@appsemble/markdown/versions/1.2.3',
    );
  });

  it('fetches a given block only once across repeated lookups', async () => {
    fetchMock.mockResolvedValue(okResponse({ name: '@appsemble/markdown' }));
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger);

    await cacher.getCachedBlockVersions([markdown]);
    await cacher.getCachedBlockVersions([markdown]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not cache a block whose manifest is missing, so it can be retried', async () => {
    fetchMock.mockResolvedValueOnce(notOkResponse());
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger);

    const first = await cacher.getCachedBlockVersions([markdown]);
    expect(first).toStrictEqual([]);

    fetchMock.mockResolvedValueOnce(okResponse({ name: '@appsemble/markdown' }));
    const [manifest] = await cacher.getCachedBlockVersions([markdown]);

    expect(manifest).toStrictEqual({ name: '@appsemble/markdown' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache a block whose fetch rejects, so it can be retried', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger);

    await expect(cacher.getCachedBlockVersions([markdown])).rejects.toThrow('network down');

    fetchMock.mockResolvedValueOnce(okResponse({ name: '@appsemble/markdown' }));
    const [manifest] = await cacher.getCachedBlockVersions([markdown]);

    expect(manifest).toStrictEqual({ name: '@appsemble/markdown' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns only the blocks that have a manifest for a mixed batch', async () => {
    const known: IdentifiableBlock = { type: 'markdown', version: '1.2.3' };
    const unknown: IdentifiableBlock = { type: 'nope', version: '0.0.1' };
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.includes('markdown') ? okResponse({ name: '@appsemble/markdown' }) : notOkResponse(),
      ),
    );
    const cacher = new BlockManifestCacher('https://blocks.example.com', logger);

    const manifests = await cacher.getCachedBlockVersions([known, unknown]);

    expect(manifests).toStrictEqual([{ name: '@appsemble/markdown' }]);
  });

  describe('Appsemble URL', () => {
    it('normalizes a trailing slash off the configured base URL', async () => {
      fetchMock.mockResolvedValue(okResponse({}));
      const cacher = new BlockManifestCacher('https://blocks.example.com/', logger);

      await cacher.getCachedBlockVersions([markdown]);

      expect(fetchedUrl(fetchMock)).toBe(
        'https://blocks.example.com/api/blocks/@appsemble/markdown/versions/1.2.3',
      );
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
});
