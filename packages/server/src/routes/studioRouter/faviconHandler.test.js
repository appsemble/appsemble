import { createInstance } from 'axios-test-instance';
import Koa from 'koa';

import studioRouter from '.';

let request;

beforeAll(async () => {
  request = await createInstance(new Koa().use(studioRouter));
});

afterAll(async () => {
  await request.close();
});

it('should serve the Appsemble icon', async () => {
  const response = await request.get('/favicon.ico');
  expect(response.headers).toMatchObject({ 'content-type': 'image/x-icon' });
});
