import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { studioRouter } from './index.js';

describe('securityTxtHandler', () => {
  beforeAll(async () => {
    await setTestApp(new Koa().use(studioRouter));
  });

  it('should serve the security.txt file', async () => {
    const response = await request.get('/.well-known/security.txt');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
  });
});
