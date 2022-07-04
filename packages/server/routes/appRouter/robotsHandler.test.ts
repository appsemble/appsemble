import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { appRouter } from '.';

beforeAll(async () => {
  await setTestApp(new Koa().use(appRouter));
});

it('should serve a valid robots.txt', async () => {
  const response = await request.get('/robots.txt');

  expect(response).toMatchObject({
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
    data: 'User-agent: *\nAllow: *\n',
  });
});
