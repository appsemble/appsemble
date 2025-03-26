import makeServiceWorkerEnv from 'service-worker-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { onFetch } from './onFetch.js';
import * as utils from './utils.js';

vi.mock('./utils');

describe('onFetch', () => {
  beforeEach(() => {
    const env = makeServiceWorkerEnv();
    Object.assign(global, env);
    // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
    env.addEventListener('fetch', onFetch);
  });

  it('should pass through requests non GET requests', async () => {
    const request = new Request('/346', { method: 'POST' });
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should pass through external requests', async () => {
    const request = new Request('https://example.com');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should pass through hot-update requests', async () => {
    const request = new Request('/app/app.hot-update.json');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should pass through requests that have a range header', async () => {
    const request = new Request('/range.request', {
      headers: { range: 'bytes=0-1024' },
    });
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should try to request app index URL first', async () => {
    const request = new Request('/');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
  });

  it('should remap nested app URLs', async () => {
    const request = new Request('/@foo/asd/foo/bar-1');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).toHaveBeenCalledWith({
      ...request,
      url: 'https://www.test.com/',
    });
  });

  it('should try to request app related content first', async () => {
    const request = new Request('/manifest.json');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
  });

  it('should cache block version requests', async () => {
    const request = new Request('/api/blocks/@appsemble/form/versions/0.1.2');
    await trigger('fetch', request);
    expect(utils.cacheFirst).toHaveBeenCalledWith(request);
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should cache static app file requests', async () => {
    const request = new Request('/_/somehash.js');
    await trigger('fetch', request);
    expect(utils.cacheFirst).toHaveBeenCalledWith(request);
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should cache app messages', async () => {
    const request = new Request('/api/apps/123/messages/nl-nl');
    await trigger('fetch', request);
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
  });

  it('should cache block version asset requests', async () => {
    const request = new Request('/api/blocks/@appsemble/form/versions/0.1.2/form.js');
    await trigger('fetch', request);
    expect(utils.cacheFirst).toHaveBeenCalledWith(request);
    expect(utils.requestFirst).not.toHaveBeenCalled();
  });

  it('should try to request app specific styles', async () => {
    const request = new Request('/core.css');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
  });

  it('should try to request app specific block styles', async () => {
    const request = new Request('/@foo/bar.css');
    await trigger('fetch', request);
    expect(utils.cacheFirst).not.toHaveBeenCalled();
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
  });
});
