import makeServiceWorkerEnv from 'service-worker-mock';

import * as utils from './utils';
import { respond } from './onFetch';

jest.mock('./utils');

describe('respond', () => {
  let cachedResponse: Response;
  let fakeResponse: Response;
  let fetchResponse: Response;

  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv(), { fetch: jest.fn(async () => fetchResponse) });
    cachedResponse = new Response();
    fakeResponse = new Response();
    fetchResponse = new Response();
    (utils.cacheFirst as jest.Mock).mockResolvedValue(cachedResponse);
    (utils.requestFirst as jest.Mock).mockResolvedValue(fakeResponse);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('should pass through requests non GET requests', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/346', { method: 'POST' });
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should pass through external requests', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('https://example.com');
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should pass through hot-update requests', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/app/app.hot-update.json');
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should try to request app index URL first', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/123');
    const response = await respond(request);
    expect(utils.requestFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/123',
      }),
    );
    expect(response).toBe(fakeResponse);
  });

  it('should remap nested app URLs', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/asd/foo/bar-1');
    const response = await respond(request);
    expect(utils.requestFirst).toHaveBeenCalled();
    expect(utils.requestFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost/asd',
      }),
    );
    expect(response).toBe(fakeResponse);
  });

  it('should try to request app related content first', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/457/manifest.json');
    const response = await respond(request);
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
    expect(response).toBe(fakeResponse);
  });

  it('should try to request the app definition first', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/api/apps/26');
    const response = await respond(request);
    expect(utils.requestFirst).toHaveBeenCalledWith(request);
    expect(response).toBe(fakeResponse);
  });

  it('should pass through other API requests', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/api/apps/26/resources/resource/123');
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should try to get static assets from the cache first', async () => {
    // eslint-disable-next-line compat/compat
    const request = new Request('http://localhost/app/76fade46f4eac.js');
    const response = await respond(request);
    expect(utils.cacheFirst).toHaveBeenCalledWith(request);
    expect(response).toBe(cachedResponse);
  });
});
