import makeServiceWorkerEnv from 'service-worker-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cacheFirstIfImmutable } from './utils.js';

const assetUrl = 'http://localhost/api/apps/1/assets/logo';

async function cacheResponse(cacheControl: string, body: string): Promise<void> {
  const cache = await caches.open('appsemble');
  await cache.put(
    new Request(assetUrl),
    new Response(body, { status: 200, headers: { 'Cache-Control': cacheControl } }),
  );
}

describe('cacheFirstIfImmutable', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv());
  });

  it('should serve a stored response that is marked immutable without going to the network', async () => {
    await cacheResponse('public,max-age=31536000,immutable', 'stored');
    const fetchSpy = vi.spyOn(global, 'fetch');

    const response = await cacheFirstIfImmutable(new Request(assetUrl));

    expect(await response.text()).toBe('stored');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should request a fresh response when the stored one may be replaced', async () => {
    await cacheResponse('public,max-age=3600', 'stored');
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('fresh', { status: 200 }));

    const response = await cacheFirstIfImmutable(new Request(assetUrl));

    expect(await response.text()).toBe('fresh');
  });

  it('should fall back to a replaceable stored response when the network is unreachable', async () => {
    await cacheResponse('public,max-age=3600', 'stored');
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    const response = await cacheFirstIfImmutable(new Request(assetUrl));

    expect(await response.text()).toBe('stored');
  });

  it('should request a response that is not stored yet', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('fresh', { status: 200 }));

    const response = await cacheFirstIfImmutable(new Request(assetUrl));

    expect(await response.text()).toBe('fresh');
  });

  it.each([404, 410])(
    'should return %s for a deleted asset and keep it unavailable offline',
    async (status) => {
      await cacheResponse('public,max-age=3600', 'stored');
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('Asset not found', { status }));

      const response = await cacheFirstIfImmutable(new Request(assetUrl));

      expect(response.status).toBe(status);
      expect(await response.text()).toBe('Asset not found');

      fetchSpy.mockRejectedValue(new Error('offline'));

      await expect(cacheFirstIfImmutable(new Request(assetUrl))).rejects.toThrow('offline');
    },
  );

  it('should serve the stored asset when the server temporarily fails', async () => {
    await cacheResponse('public,max-age=3600', 'stored');
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('Unavailable', { status: 503 }));

    const response = await cacheFirstIfImmutable(new Request(assetUrl));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('stored');
  });

  it.each([404, 410])(
    'should evict all query variants on %s while preserving other assets',
    async (status) => {
      const deletedUrls = [
        assetUrl,
        `${assetUrl}?width=150&height=150`,
        `${assetUrl}?width=300&height=300`,
      ];
      const otherUrls = [
        `${assetUrl}-other?width=150&height=150`,
        'http://localhost/api/apps/2/assets/logo?width=150&height=150',
        'http://other.localhost/api/apps/1/assets/logo?width=150&height=150',
      ];
      const cache = await caches.open('appsemble');
      for (const url of [...deletedUrls, ...otherUrls]) {
        await cache.put(
          new Request(url),
          new Response('stored', { headers: { 'Cache-Control': 'public,max-age=3600' } }),
        );
      }
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('Asset not found', { status }));

      const response = await cacheFirstIfImmutable(new Request(deletedUrls[1]));

      expect(response.status).toBe(status);
      fetchSpy.mockRejectedValue(new Error('offline'));
      for (const url of deletedUrls) {
        await expect(cacheFirstIfImmutable(new Request(url))).rejects.toThrow('offline');
      }
      for (const url of otherUrls) {
        const stored = await cacheFirstIfImmutable(new Request(url));
        expect(await stored.text()).toBe('stored');
      }
    },
  );
});
