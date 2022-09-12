import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { studioRouter } from './index.js';

beforeEach(async () => {
  request.defaults.responseType = 'arraybuffer';
  await setTestApp(new Koa().use(studioRouter));
});

it('should serve the Appsemble icon', async () => {
  const response = await request.get('/icon-532.png');
  expect(response.headers).toMatchObject({ 'content-type': 'image/png' });
  expect(response.data).toMatchImageSnapshot();
});

it('should serve a white background if an opaque icon is requested', async () => {
  const response = await request.get('/icon-23.png?opaque=true');
  expect(response.headers).toMatchObject({ 'content-type': 'image/png' });
  expect(response.data).toMatchImageSnapshot();
});
