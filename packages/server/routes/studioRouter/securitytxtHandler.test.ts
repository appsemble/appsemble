import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, expect, it } from 'vitest';

import { studioRouter } from './index.js';

beforeAll(async () => {
  await setTestApp(new Koa().use(studioRouter));
});

it('should serve the security.txt file', async () => {
  const response = await request.get('/.well-known/security.txt');
  expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
});
