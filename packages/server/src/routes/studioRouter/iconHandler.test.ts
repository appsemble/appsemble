import { AxiosTestInstance, createInstance } from 'axios-test-instance';
import Koa from 'koa';

import studioRouter from '.';

let request: AxiosTestInstance;

beforeEach(async () => {
  request = await createInstance(new Koa().use(studioRouter), { responseType: 'arraybuffer' });
});

afterEach(async () => {
  await request.close();
});

it('should serve the Appsemble icon', async () => {
  const response = await request.get('/icon-532.png');
  expect(response.headers).toMatchObject({ 'content-type': 'image/png' });
  expect(response.data).toMatchImageSnapshot();
});

it('should serve a white background if an opaque icon is requested', async () => {
  const response = await request.get('/icon-23.png');
  expect(response.headers).toMatchObject({ 'content-type': 'image/png' });
  expect(response.data).toMatchImageSnapshot();
});
