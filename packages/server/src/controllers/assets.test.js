import { createInstance } from 'axios-test-instance';

import { App, Asset } from '../models';
import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

let db;
let request;
let server;
let organizationId;
let user;
let authorization;
let app;

beforeAll(async () => {
  db = await testSchema('assets');

  server = await createServer({ db, argv: { host: 'http://localhost', secret: 'test' } });
  request = await createInstance(server);
}, 10e3);

beforeEach(async () => {
  await truncate();
  ({ authorization, user } = await testToken());
  ({ id: organizationId } = await user.createOrganization(
    {
      id: 'testorganization',
      name: 'Test Organization',
    },
    { through: { role: 'Owner' } },
  ));

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

afterAll(async () => {
  await request.close();
  await db.close();
});

describe('getAssetById', () => {
  it('should be able to fetch an asset', async () => {
    const data = Buffer.from('buffer');
    const asset = await app.createAsset({
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
    const asset = await appB.createAsset({
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
    const response = await request.post(`/api/apps/${app.id}/assets`, Buffer.alloc(0));
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
      headers: { authorization },
    });
    const asset = await Asset.findByPk(response.data.id);

    expect(asset.UserId).toStrictEqual(user.id);
    expect(response).toMatchObject({
      status: 201,
      data: { id: expect.any(Number) },
    });
  });
});
