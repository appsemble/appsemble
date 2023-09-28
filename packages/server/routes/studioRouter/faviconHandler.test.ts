import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, expect, it } from 'vitest';

import { studioRouter } from './index.js';

beforeAll(async () => {
  await setTestApp(new Koa().use(studioRouter));
});

it('should serve the Appsemble icon', async () => {
  const response = await request.get('/favicon.ico');
  expect(response.headers).toMatchObject({ 'content-type': 'image/x-icon' });
});
