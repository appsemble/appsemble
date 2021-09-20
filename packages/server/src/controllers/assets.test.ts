import { createFixtureStream, createFormData } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';

import { App, Asset, Member, Organization, Resource, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let organization: Organization;
let user: User;
let app: App;

beforeAll(createTestSchema('assets'));

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

afterEach(truncate);

afterAll(closeTestSchema);

describe('getAssets', () => {
  it('should return an empty array if no assets exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
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
    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: assetA.id, mime: assetA.mime, filename: assetA.filename, name: 'a' },
        {
          id: assetB.id,
          mime: assetB.mime,
          filename: assetB.filename,
          resourceId: resource.id,
          resourceType: 'testResource',
        },
      ],
    });
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
    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: assetA.id, mime: assetA.mime, filename: assetA.filename },
        { id: assetB.id, mime: assetB.mime, filename: assetB.filename },
      ],
    });
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
      }),
      data,
    });
  });

  it('should be able to fetch an by name', async () => {
    const data = Buffer.from('buffer');
    await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data,
      name: 'test-asset',
    });

    const response = await request.get(`/api/apps/${app.id}/assets/test-asset`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="test.bin"',
      }),
      data,
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

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'Asset not found', statusCode: 404 },
    });
  });

  it('should fetch assets from apps that don’t exist', async () => {
    const response = await request.get('/api/apps/0/assets/0');

    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });
});

describe('createAsset', () => {
  it('should be able to create an asset', async () => {
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);
    const response = await request.post<Asset>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: data, name: 'test-asset' }),
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        id: expect.stringMatching(/^[0-F]{8}(?:-[0-F]{4}){3}-[0-F]{12}$/i),
        mime: 'application/octet-stream',
        name: 'test-asset',
      },
    });

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
    expect(response).toMatchObject({
      status: 409,
      data: {
        error: 'Conflict',
        message: 'An asset named conflict already exists',
        statusCode: 409,
      },
    });
  });

  it('should accept empty files', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        id: expect.stringMatching(/^[0-F]{8}(?:-[0-F]{4}){3}-[0-F]{12}$/i),
        mime: 'application/octet-stream',
      },
    });
  });

  it('should support filenames', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: createFixtureStream('10x50.png') }),
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        id: expect.stringMatching(/^[0-F]{8}(?:-[0-F]{4}){3}-[0-F]{12}$/i),
        filename: '10x50.png',
        mime: 'image/png',
      },
    });
  });

  it('should not create assets for apps that don’t exist', async () => {
    const response = await request.post(
      '/api/apps/0/assets',
      createFormData({ file: Buffer.alloc(0) }),
    );
    expect(response).toMatchObject({
      status: 404,
      data: { message: 'App not found', statusCode: 404, error: 'Not Found' },
    });
  });

  it('should associate the user if the user is authenticated', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
    const asset = await Asset.findByPk(response.data.id);

    expect(asset.UserId).toStrictEqual(user.id);
    expect(response).toMatchObject({
      status: 201,
      data: {
        id: expect.stringMatching(/^[0-F]{8}(?:-[0-F]{4}){3}-[0-F]{12}$/i),
        mime: 'application/octet-stream',
      },
    });
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

    expect(response.status).toStrictEqual(204);
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

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
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

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Asset not found', statusCode: 404, error: 'Not Found' },
    });
  });
});
