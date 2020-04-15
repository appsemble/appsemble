import { createInstance } from 'axios-test-instance';
import * as fs from 'fs';
import Koa from 'koa';
import * as path from 'path';

import boomMiddleware from '../../middleware/boom';
import { BlockAsset, Organization } from '../../models';
import testSchema from '../../utils/test/testSchema';
import truncate from '../../utils/test/truncate';
import appRouter from '.';

let request;
let db;

beforeAll(async () => {
  db = await testSchema('blockAssetHandler');
  request = await createInstance(new Koa().use(boomMiddleware()).use(appRouter));
});

afterEach(async () => {
  await truncate();
});

afterAll(async () => {
  await request.close();
  await db.close();
});

it('should download a block asset', async () => {
  await Organization.create({ id: 'linux', name: 'Linux' });
  await BlockAsset.create({
    filename: 'tux.png',
    content: await fs.promises.readFile(path.join(__dirname, '__fixtures__', 'tux.png')),
    mime: 'image/png',
    OrganizationId: 'linux',
    name: 'tux',
    version: '3.1.4',
  });
  const response = await request.get('/api/blocks/@linux/tux/versions/3.1.4/tux.png', {
    responseType: 'arraybuffer',
  });
  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toBe('image/png');
  expect(response.data).toMatchImageSnapshot();
});

it('should respond with 404 when trying to fetch a non existing block asset', async () => {
  const response = await request.get('/api/blocks/@linux/tux/versions/3.1.4/tux.png');
  expect(response).toMatchObject({
    status: 404,
    data: {
      error: 'Not Found',
      message: 'Block asset not found',
      statusCode: 404,
    },
  });
});
