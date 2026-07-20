import { getS3FileBuffer, uploadS3File } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;

describe('getAppAssetById', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
  });

  it('should be able to fetch an asset', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });

    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="test.bin"',
        'cache-control': 'max-age=31536000,immutable',
      }),
    });
  });

  it('should be able to fetch an asset by name', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.mp3',
      name: 'test-asset',
    });

    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const response = await request.get(`/api/apps/${app.id}/assets/test-asset`);

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="test.mp3"',
        'cache-control': 'max-age=31536000,immutable',
      }),
    });
  });

  it('should return a full-size jpeg derivative when larger size is specified.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=150&height=150`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
        'cache-control': 'max-age=31536000,immutable',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(100);
  });

  it('should return a full-size jpeg derivative when no size is specified.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
        'cache-control': 'max-age=31536000,immutable',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.width).toBe(120);
    expect(metadata.height).toBe(80);
  });

  it('should cap the no-bounds derivative to 1024px on the longest edge.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 2000,
        height: 1500,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    // Longest edge capped to 1024, aspect ratio preserved (2000x1500 -> 1024x768).
    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(768);
  });

  it('should encode a transparent source as webp to preserve alpha.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/webp',
        'content-disposition': `inline; filename="${asset.id}.webp"`,
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.format).toBe('webp');
    expect(metadata.hasAlpha).toBe(true);

    // The codec-neutral cache row records the real codec in its mime column.
    const cachedAssets = await Asset.findAll({
      where: { name: `${asset.id}-full` },
      attributes: ['id', 'mime'],
    });
    expect(cachedAssets).toHaveLength(1);
    expect(cachedAssets[0].mime).toBe('image/webp');
  });

  it('should cache and reuse the full-size jpeg derivative.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const firstResponse = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(firstResponse).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
      }),
    });

    const cachedAssets = await Asset.findAll({
      where: { name: `${asset.id}-full` },
      attributes: ['id'],
    });
    expect(cachedAssets).toHaveLength(1);

    const cachedBuffer = await getS3FileBuffer(`app-${app.id}`, cachedAssets[0].id);

    const secondResponse = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(secondResponse).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
      }),
    });
    expect(Buffer.from(secondResponse.data)).toStrictEqual(cachedBuffer);

    const cachedAssetsAfter = await Asset.findAll({
      where: { name: `${asset.id}-full` },
      attributes: ['id'],
    });
    expect(cachedAssetsAfter).toHaveLength(1);
    expect(cachedAssetsAfter[0].id).toBe(cachedAssets[0].id);
  });

  it('should serve concurrent requests for an uncached derivative without failing.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: 0, g: 128, b: 255 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    // Fire several requests together so they all miss the cache and race to create the derivative
    // with the same deterministic name; the loser(s) hit the unique constraint.
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request.get(`/api/apps/${app.id}/assets/${asset.id}`, { responseType: 'arraybuffer' }),
      ),
    );

    for (const response of responses) {
      expect(response).toMatchObject({
        status: 200,
        headers: expect.objectContaining({
          'content-type': 'image/jpeg',
        }),
      });
    }

    const cachedAssets = await Asset.findAll({
      where: { name: `${asset.id}-full` },
      attributes: ['id'],
    });
    expect(cachedAssets).toHaveLength(1);
  });

  it('should resize the image when the requested size is smaller.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=150&height=150`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
        'cache-control': 'max-age=31536000,immutable',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.width).toBe(150);
    expect(metadata.height).toBe(150);
  });

  it('should not resize the asset when its not an image, only return original.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });

    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const response = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=100&height=100`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="test.bin"',
        'cache-control': 'max-age=31536000,immutable',
      }),
    });
  });

  it('should resize the image, store it in s3 and return it.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=10&height=10`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
        'cache-control': 'max-age=31536000,immutable',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.width).toBe(10);
    expect(metadata.height).toBe(10);
  });

  it('should append an jpeg extension when resizing images without a filename extension', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
      filename: 'logo',
    });
    const image = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=10&height=10`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': 'inline; filename="logo.jpeg"',
      }),
    });
  });

  it('should reuse cached resized assets on later requests', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const image = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const firstResponse = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=10&height=10`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(firstResponse).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
      }),
    });

    const cachedAssets = await Asset.findAll({
      where: { name: `${asset.id}10x10` },
      attributes: ['id'],
    });
    expect(cachedAssets).toHaveLength(1);

    const cachedBuffer = await getS3FileBuffer(`app-${app.id}`, cachedAssets[0].id);

    const secondResponse = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=10&height=10`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(secondResponse).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
      }),
    });
    expect(Buffer.from(secondResponse.data)).toStrictEqual(cachedBuffer);

    const cachedAssetsAfter = await Asset.findAll({
      where: { name: `${asset.id}10x10` },
      attributes: ['id'],
    });
    expect(cachedAssetsAfter).toHaveLength(1);
    expect(cachedAssetsAfter[0].id).toBe(cachedAssets[0].id);
  });

  it('should regenerate resized assets when cached image is missing from s3', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const staleResizedAsset = await Asset.create({
      name: `${asset.id}10x10`,
      mime: 'image/jpeg',
    });
    const image = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(
      `/api/apps/${app.id}/assets/${asset.id}?width=10&height=10`,
      {
        responseType: 'arraybuffer',
      },
    );

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
        'cache-control': 'max-age=31536000,immutable',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.width).toBe(10);
    expect(metadata.height).toBe(10);

    const deletedCachedAsset = await Asset.findByPk(staleResizedAsset.id, {
      paranoid: false,
      attributes: ['deleted'],
    });
    expect(deletedCachedAsset?.deleted).toBeTruthy();

    const regeneratedCachedAsset = await Asset.findOne({
      where: { name: `${asset.id}10x10` },
      attributes: ['id', 'deleted'],
    });
    expect(regeneratedCachedAsset).toBeTruthy();
    expect(regeneratedCachedAsset?.id).not.toBe(staleResizedAsset.id);
    expect(regeneratedCachedAsset?.deleted).toBeFalsy();
  });

  it('should regenerate the full-size jpeg derivative when the cached image is missing from s3.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
    });
    const staleFullAsset = await Asset.create({
      name: `${asset.id}-full`,
      mime: 'image/jpeg',
    });
    const image = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/jpeg',
        'content-disposition': `inline; filename="${asset.id}.jpeg"`,
        'cache-control': 'max-age=31536000,immutable',
      }),
    });

    const metadata = await sharp(response.data).metadata();

    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(100);

    const deletedCachedAsset = await Asset.findByPk(staleFullAsset.id, {
      paranoid: false,
      attributes: ['deleted'],
    });
    expect(deletedCachedAsset?.deleted).toBeTruthy();

    const regeneratedCachedAsset = await Asset.findOne({
      where: { name: `${asset.id}-full` },
      attributes: ['id', 'deleted'],
    });
    expect(regeneratedCachedAsset).toBeTruthy();
    expect(regeneratedCachedAsset?.id).not.toBe(staleFullAsset.id);
    expect(regeneratedCachedAsset?.deleted).toBeFalsy();
  });

  it('should fallback to the asset id as the filename', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create();

    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename="${asset.id}"`,
      }),
    });
  });

  it('should determine the file extension based on the mime type', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'text/plain',
    });

    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'text/plain',
        'content-disposition': `attachment; filename="${asset.id}.txt"`,
      }),
    });
  });

  it('should not fetch assets from other apps', async () => {
    const appB = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app-B',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const { Asset } = await getAppDB(appB.id);
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Asset not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not fetch deleted assets', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });

    await uploadS3File(`app-${app.id}`, asset.id, Buffer.from('buffer'));

    const assetId = asset.id;
    const { status } = await request.get(`/api/apps/${app.id}/assets/${assetId}`);
    expect(status).toBe(200);
    authorizeStudio(user);
    const deletedAsset = await request.delete(`/api/apps/${app.id}/assets/${assetId}`);
    expect(deletedAsset.status).toBe(204);
    const response = await request.get(`/api/apps/${app.id}/assets/${assetId}`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Asset not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not fetch assets from apps that don’t exist', async () => {
    const response = await request.get('/api/apps/0/assets/0');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });
});
