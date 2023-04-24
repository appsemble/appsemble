import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';

import { appRouter } from './index.js';
import { boomMiddleware } from '../../middleware/boom.js';
import { BlockAsset, BlockVersion, Organization } from '../../models/index.js';
import { useTestDatabase } from '../../utils/test/testSchema.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  await setTestApp(new Koa().use(boomMiddleware()).use(appRouter));
});

it('should download a block asset', async () => {
  await Organization.create({ id: 'linux', name: 'Linux' });
  const { id } = await BlockVersion.create({
    OrganizationId: 'linux',
    version: '3.1.4',
    name: 'tux',
  });
  await BlockAsset.create({
    filename: 'tux.png',
    content: await readFixture('tux.png'),
    mime: 'image/png',
    BlockVersionId: id,
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
