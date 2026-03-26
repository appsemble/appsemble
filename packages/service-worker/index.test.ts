import makeServiceWorkerEnv from 'service-worker-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('service worker install', () => {
  beforeEach(() => {
    vi.resetModules();
    const env = makeServiceWorkerEnv();
    Object.assign(global, env);
    // @ts-expect-error test global injection
    global.appAssets = [{ url: '/_/main.js' }, { url: '/core.css' }];
  });

  it('should precache only app assets during install', async () => {
    const addAll = vi.fn().mockResolvedValue('cached');
    const open = vi.fn().mockResolvedValue({ addAll });

    global.caches.open = open as typeof caches.open;

    await import('./index.js');

    await trigger('install');

    expect(open).toHaveBeenCalledWith('appsemble');
    expect(addAll).toHaveBeenCalledWith(['/_/main.js', '/core.css']);
  });
});
