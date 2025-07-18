import { uploadS3File } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
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

  it('should be able to fetch an by name', async () => {
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
    authorizeStudio();
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

  it('should fetch assets from apps that don’t exist', async () => {
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
