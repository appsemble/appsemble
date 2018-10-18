import makeServiceWorkerEnv from 'service-worker-mock';

import * as utils from './utils';
import { respond } from './onFetch';

describe('respond', () => {
  let cacheFirst;
  let requestFirst;
  let cachedResponse;
  let fakeResponse;
  let fetchResponse;

  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv());
    cachedResponse = new Response();
    fakeResponse = new Response();
    fetchResponse = new Response();
    global.fetch = jest.fn(async () => fetchResponse);
    cacheFirst = jest.spyOn(utils, 'cacheFirst').mockResolvedValue(cachedResponse);
    requestFirst = jest.spyOn(utils, 'requestFirst').mockResolvedValue(fakeResponse);
  });

  afterEach(() => {
    delete global.fetch;
    jest.resetAllMocks();
  });

  it('should pass through requests non GET requests', async () => {
    const request = new Request('http://localhost/346', { method: 'POST' });
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should pass through external requests', async () => {
    const request = new Request('https://example.com');
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should pass through hot-update requests', async () => {
    const request = new Request('http://localhost/app/app.hot-update.json');
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should try to request app index URL first', async () => {
    const request = new Request('http://localhost/123');
    const response = await respond(request);
    expect(requestFirst).toHaveBeenCalled();
    expect(requestFirst.mock.calls[0][0].url).toBe('http://localhost/123');
    expect(response).toBe(fakeResponse);
  });

  it('should remap nested app URLs', async () => {
    const request = new Request('http://localhost/asd/foo/bar-1');
    const response = await respond(request);
    expect(requestFirst).toHaveBeenCalled();
    expect(requestFirst.mock.calls[0][0].url).toBe('http://localhost/asd');
    expect(response).toBe(fakeResponse);
  });

  it('should try to request app related content first', async () => {
    const request = new Request('http://localhost/457/manifest.json');
    const response = await respond(request);
    expect(requestFirst).toHaveBeenCalledWith(request);
    expect(response).toBe(fakeResponse);
  });

  it('should try to request the app definition first', async () => {
    const request = new Request('http://localhost/api/apps/26');
    const response = await respond(request);
    expect(requestFirst).toHaveBeenCalledWith(request);
    expect(response).toBe(fakeResponse);
  });

  it('should pass through other API requests', async () => {
    const request = new Request('http://localhost/api/apps/26/resource/123');
    const response = await respond(request);
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(fetchResponse);
  });

  it('should try to get static assets from the cache first', async () => {
    const request = new Request('http://localhost/_/static/app/76fade46f4eac.js');
    const response = await respond(request);
    expect(cacheFirst).toHaveBeenCalledWith(request);
    expect(response).toBe(cachedResponse);
  });
});
