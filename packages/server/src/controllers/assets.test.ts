import { request, setTestApp } from 'axios-test-instance';

import { App, Asset, Member, Organization, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let organizationId: string;
let user: User;
let authorization: string;
let app: App;

beforeAll(createTestSchema('assets'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  ({ id: organizationId } = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  }));
  await Member.create({ OrganizationId: organizationId, UserId: user.id, role: 'Owner' });

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
    OrganizationId: organizationId,
  });
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getAssets', () => {
  it('should return an empty array if no assets exist', async () => {
    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should fetch all of the app’s assets', async () => {
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

    const response = await request.get(`/api/apps/${app.id}/assets`);
    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: assetA.id, mime: assetA.mime, filename: assetA.filename },
        { id: assetB.id, mime: assetB.mime, filename: assetB.filename },
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
      OrganizationId: organizationId,
    });
    await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'foo.bin',
      data: Buffer.from('bar'),
    });

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
      headers: expect.objectContaining({ 'content-type': 'application/octet-stream' }),
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
      OrganizationId: organizationId,
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
    const createResponse = await request.post(`/api/apps/${app.id}/assets`, data, {
      headers: { 'content-type': 'application/octet-stream' },
    });
    expect(createResponse).toMatchObject({
      status: 201,
      data: { id: expect.any(Number) },
    });

    const getResponse = await request.get(`/api/apps/${app.id}/assets/${createResponse.data.id}`, {
      responseType: 'arraybuffer',
    });
    expect(getResponse).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'application/octet-stream',
      },
      data,
    });
  });

  it('should accept empty files', async () => {
    const response = await request.post(`/api/apps/${app.id}/assets`, Buffer.alloc(0), {
      headers: { 'content-type': 'application/octet-stream' },
    });
    expect(response).toMatchObject({
      status: 201,
      data: { id: expect.any(Number) },
    });
  });

  it('should not create assets for apps that don’t exist', async () => {
    const response = await request.post('/api/apps/0/assets', Buffer.alloc(0));
    expect(response).toMatchObject({
      status: 404,
      data: { message: 'App not found', statusCode: 404, error: 'Not Found' },
    });
  });

  it('should associate the user if the user is authenticated', async () => {
    const response = await request.post(`/api/apps/${app.id}/assets`, Buffer.alloc(0), {
      headers: { authorization, 'content-type': 'application/octet-stream' },
    });
    const asset = await Asset.findByPk(response.data.id);

    expect(asset.UserId).toStrictEqual(user.id);
    expect(response).toMatchObject({
      status: 201,
      data: { id: expect.any(Number) },
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

    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`, {
      headers: { authorization },
    });

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

    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`, {
      headers: { authorization },
    });

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
      OrganizationId: organizationId,
    });

    const asset = await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    const response = await request.delete(`/api/apps/${app.id}/assets/${asset.id}`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Asset not found', statusCode: 404, error: 'Not Found' },
    });
  });
});
