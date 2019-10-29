import Koa from 'koa';
import request from 'supertest';

import editorRouter from '.';

let app;

beforeEach(async () => {
  app = new Koa();
  app.use(editorRouter);
});

it('should serve the Appsemble icon', async () => {
  const response = await request(app.callback()).get('/favicon.ico');
  expect(response.type).toBe('image/x-icon');
});
