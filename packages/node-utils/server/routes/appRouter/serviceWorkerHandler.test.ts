import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeEach, describe, expect, it } from 'vitest';

import { createServiceWorkerHandler } from './serviceWorkerHandler.js';

let serviceWorkerContent: string;

describe('createServiceWorkerHandler', () => {
  beforeEach(async () => {
    serviceWorkerContent = 'self.addEventListener("fetch", () => {});';
    const app = new Koa();
    app.use((ctx, next) => {
      ctx.fs = {
        promises: {
          readFile: () => Promise.resolve(serviceWorkerContent),
        },
      };
      return next();
    });
    app.use(createServiceWorkerHandler());
    await setTestApp(app);
  });

  it('should serve the service worker as JavaScript with an etag', async () => {
    const response = await request.get('/service-worker.js');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch('application/javascript');
    expect(response.headers.etag).toBeTruthy();
    expect(response.headers['cache-control']).toMatch('no-cache');
    expect(response.data).toBe(serviceWorkerContent);
  });

  it('should respond with an empty 304 response if the etag matches', async () => {
    const initial = await request.get('/service-worker.js');

    const response = await request.get('/service-worker.js', {
      headers: { 'if-none-match': initial.headers.etag },
      validateStatus: (status) => status === 304,
    });

    expect(response.status).toBe(304);
    expect(response.data).toBeFalsy();
  });

  it('should serve the new service worker with a new etag if the content changes', async () => {
    const initial = await request.get('/service-worker.js');
    serviceWorkerContent = 'self.addEventListener("push", () => {});';

    const response = await request.get('/service-worker.js', {
      headers: { 'if-none-match': initial.headers.etag },
    });

    expect(response.status).toBe(200);
    expect(response.headers.etag).toBeTruthy();
    expect(response.headers.etag).not.toBe(initial.headers.etag);
    expect(response.data).toBe(serviceWorkerContent);
  });
});
