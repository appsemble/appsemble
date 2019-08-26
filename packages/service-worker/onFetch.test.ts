import makeServiceWorkerEnv from 'service-worker-mock';

import { respond } from './onFetch';
import * as utils from './utils';

jest.mock('./utils');

describe('respond', () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv(), { fetch: jest.fn() });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('should pass through requests non GET requests', async () => {
    const request = new Request('http://localhost/346', { method: 'POST' });
    await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it('should pass through external requests', async () => {
    const request = new Request('https://example.com');
    await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it('should pass through hot-update requests', async () => {
    const request = new Request('http://localhost/app/app.hot-update.json');
    await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it('should try to request app index URL first', async () => {
    const request = new Request('http://localhost/@foo/test123');
    await respond(request);
    expect(utils.requestFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/@foo/test123',
      }),
    );
  });

  it('should remap nested app URLs', async () => {
    const request = new Request('http://localhost/@foo/asd/foo/bar-1');
    await respond(request);
    expect(utils.requestFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/@foo/asd',
      }),
    );
  });

  it('should try to request app related content first', async () => {
    const request = new Request('http://localhost/457/manifest.json');
    await respond(request);
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
  });

  it('should cache block version requests', async () => {
    const request = new Request('http://localhost/api/blocks/@appsemble/form/versions/0.1.2');
    await respond(request);
    expect(utils.cacheFirst).toHaveBeenCalledWith(request);
  });

  it('should pass through other API requests', async () => {
    const request = new Request('http://localhost/api/apps/26/resources/banana/123');
    await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it('should pass through API explorer requests', async () => {
    const request = new Request('http://localhost/api-explorer');
    await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it('should pass internal requests', async () => {
    const request = new Request('http://localhost/apps');
    await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it('should try to get static assets from the cache first', async () => {
    const request = new Request('http://localhost/@foo/app/76fade46f4eac.js');
    await respond(request);
    expect(utils.cacheFirst).toHaveBeenCalledWith(request);
  });
});
