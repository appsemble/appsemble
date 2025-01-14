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
import { assetsCache } from '../../../../utils/assetCache.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;

describe('deleteAppAsset', () => {
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

  it('should delete existing assets', async () => {
    const asset = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should soft-delete assets', async () => {
    const asset = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const assetId = asset.id;
    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    const deletedAsset = await Asset.findByPk(assetId, { paranoid: false });
    expect(deletedAsset).toMatchObject({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
      deleted: expect.any(Date),
    });
  });

  it('should clear existing assets in cache', async () => {
    const asset = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    const assetId = asset.id;
    await request.get(`/api/apps/${app.id}/assets/${assetId}`);
    expect(assetsCache.get(`${app.id}-${assetId}`)).toMatchObject({
      filename: 'test.bin',
      mime: 'application/octet-stream',
      name: null,
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`);
    expect(assetsCache.get(`${app.id}-${assetId}`)).toBeUndefined();

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not delete assets if the user has insufficient permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id } },
    );

    const asset = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not delete existing assets from different apps', async () => {
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

    const asset = await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`);

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
});
