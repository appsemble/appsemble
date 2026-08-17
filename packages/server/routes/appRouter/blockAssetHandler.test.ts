import { errorMiddleware, readFixture, uploadS3File } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { appRouter } from './index.js';
import { BlockAsset, BlockVersion, Organization } from '../../models/index.js';
import { getBlockAssetsBucketName } from '../../utils/blockAssets.js';

describe('blockAssetHandler', () => {
  beforeAll(async () => {
    await setTestApp(new Koa().use(errorMiddleware()).use(appRouter));
  });

  it('should download a block asset', async () => {
    await Organization.create({ id: 'linux', name: 'Linux' });
    const { id } = await BlockVersion.create({
      OrganizationId: 'linux',
      version: '3.1.4',
      name: 'tux',
    });
    const content = await readFixture('tux.png');
    const storageKey = 'linux/tux/3.1.4/hash/tux.png';

    await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength);
    await BlockAsset.create({
      content,
      filename: 'tux.png',
      mime: 'image/png',
      size: content.byteLength,
      storageKey,
      BlockVersionId: id,
    });
    const response = await request.get('/api/blocks/@linux/tux/versions/3.1.4/tux.png', {
      responseType: 'arraybuffer',
    });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['cache-control']).toBe('public,max-age=31536000,immutable');
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
});
