import Koa from 'koa';
import request from 'supertest';

import fallbackRouter from '.';

let app;

beforeEach(() => {
  app = new Koa();
  app.use(fallbackRouter);
});

it('should serve the fallback index page with correct headers', async () => {
  const response = await request(app.callback()).get('/foo');
  expect(response.status).toBe(302);
  expect(response.headers.location).toBe('/');
});
