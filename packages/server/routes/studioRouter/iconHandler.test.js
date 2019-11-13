import Koa from 'koa';
import request from 'supertest';

import studioRouter from '.';

let app;

beforeEach(async () => {
  app = new Koa();
  app.use(studioRouter);
});

it('should serve the Appsemble icon', async () => {
  const response = await request(app.callback()).get('/icon-532.png');
  expect(response.type).toBe('image/png');
  expect(response.body).toMatchImageSnapshot();
});

it('should serve a white background if an opaque icon is requested', async () => {
  const response = await request(app.callback()).get('/icon-23.png');
  expect(response.type).toBe('image/png');
  expect(response.body).toMatchImageSnapshot();
});
