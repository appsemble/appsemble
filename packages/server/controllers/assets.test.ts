import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import { Asset as AssetType } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import { App, Asset, Member, Organization, Resource, User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let user: User;
let app: App;

useTestDatabase('assets');

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
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });

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

describe('getAssets', () => {
  it('should return an empty array if no assets exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });

  it('should fetch all of the app’s assets', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResource',
      data: {},
    });

    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
      name: 'a',
    });

    const assetB = await Asset.create({
      AppId: app.id,
      ResourceId: resource.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get<AssetType[]>(`/api/apps/${app.id}/assets`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "name": "a",
        },
        {
          "filename": "foo.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "resourceId": 1,
          "resourceType": "testResource",
        },
      ]
    `,
    );
    expect(response.data[0].id).toBe(assetA.id);
    expect(response.data[1].id).toBe(assetB.id);
  });

  it('should not fetch another app’s assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

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
    await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get<AssetType[]>(`/api/apps/${app.id}/assets`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "foo.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
    expect(response.data[0].id).toBe(assetA.id);
    expect(response.data[1].id).toBe(assetB.id);
  });
});

describe('countAssets', () => {
  it('should return 0 if no assets exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets/count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should return the number of assets', async () => {
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets/count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should not count another app’s assets', async () => {
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

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
    await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets/count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should not count another organization’s assets', async () => {
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    const organizationB = await Organization.create({
      name: 'Test Organization',
    });
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
      OrganizationId: organizationB.id,
    });
    await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets/count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });
});

describe('getAssetById', () => {
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

describe('createAsset', () => {
  it('should be able to create an asset', async () => {
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);
    const response = await request.post<Asset>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: data, name: 'test-asset' }),
    );
    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "mime": "application/octet-stream",
        "name": "test-asset",
      }
    `,
    );

    const asset = await Asset.findByPk(response.data.id);
    expect(asset).toMatchObject({
      AppId: app.id,
      data,
      filename: null,
      mime: 'application/octet-stream',
      name: 'test-asset',
      UserId: null,
    });
  });

  it('should not allow using conflicting names', async () => {
    await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0), name: 'conflict' }),
    );
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0), name: 'conflict' }),
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "An asset named conflict already exists",
        "statusCode": 409,
      }
    `);
  });

  it('should accept empty files', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "mime": "application/octet-stream",
      }
    `,
    );
  });

  it('should support filenames', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: createFixtureStream('10x50.png') }),
    );
    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "filename": "10x50.png",
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "mime": "image/png",
      }
    `,
    );
  });

  it('should not create assets for apps that don’t exist', async () => {
    const response = await request.post(
      '/api/apps/0/assets',
      createFormData({ file: Buffer.alloc(0) }),
    );
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

  it('should associate the user if the user is authenticated', async () => {
    authorizeStudio();
    const response = await request.post<AssetType>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
    const asset = await Asset.findByPk(response.data.id);

    expect(asset.UserId).toStrictEqual(user.id);
    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "mime": "application/octet-stream",
      }
    `,
    );
  });
});

describe('deleteAsset', () => {
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

  it('should not delete assets if the user has insufficient permissions', async () => {
    await Member.update({ role: 'Member' }, { where: { UserId: user.id } });

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
        "message": "User does not have sufficient permissions.",
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

describe('deleteAssets', () => {
  it('should delete existing assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const assetsResponse = await request.get(`/api/apps/${app.id}/assets`);
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [assetA.id, assetB.id],
    });
    const newAssetsResponse = await request.get(`/api/apps/${app.id}/assets`);

    expect(assetsResponse).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(newAssetsResponse).toMatchInlineSnapshot(
      { data: [{ id: expect.stringMatching(uuid4Pattern) }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
  });

  it('should ignore non-existent IDs when deleting multiple existing assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const assetsResponse = await request.get(`/api/apps/${app.id}/assets`);
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [assetA.id, assetB.id],
    });
    const newAssetsResponse = await request.get(`/api/apps/${app.id}/assets`);

    expect(assetsResponse).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(newAssetsResponse).toMatchInlineSnapshot(
      { data: [{ id: expect.stringMatching(uuid4Pattern) }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
  });
});
