import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  Asset,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;
let app: App;

useTestDatabase(import.meta);

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

describe('getAppAssetById', () => {
  it('should be able to fetch an asset', async () => {
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data,
    });

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
      data,
    });
  });

  it('should be able to fetch an by name', async () => {
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.mp3',
      data,
      name: 'test-asset',
    });

    const response = await request.get(`/api/apps/${app.id}/assets/test-asset`);

    expect(response).toMatchObject({
      status: 302,
      headers: expect.objectContaining({
        location: `/api/apps/1/assets/${asset.id}`,
        'content-type': 'text/plain; charset=utf-8',
      }),
      data: 'Found',
    });
  });

  it('should fallback to the asset id as the filename', async () => {
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      AppId: app.id,
      data,
    });

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename="${asset.id}"`,
      }),
      data,
    });
  });

  it('should determine the file extension based on the mime type', async () => {
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      AppId: app.id,
      mime: 'text/plain',
      data,
    });

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'text/plain',
        'content-disposition': `attachment; filename="${asset.id}.txt"`,
      }),
      data,
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
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data,
    });

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
