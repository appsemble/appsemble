import { type Asset as AssetType, PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
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

describe('queryAppAssets', () => {
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
    const { Asset, Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: {},
    });

    const assetA = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
      name: 'a',
    });

    const assetB = await Asset.create({
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
          "filename": "foo.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "resourceId": 1,
          "resourceType": "testResource",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "name": "a",
        },
      ]
    `,
    );
    expect(response.data[0].id).toBe(assetB.id);
    expect(response.data[1].id).toBe(assetA.id);
  });

  it('should not fetch another app’s assets', async () => {
    const { Asset } = await getAppDB(app.id);
    const assetA = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    const assetB = await Asset.create({
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
    const { Asset: AssetB } = await getAppDB(appB.id);
    await AssetB.create({
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
          "filename": "foo.bin",
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
    expect(response.data[0].id).toBe(assetB.id);
    expect(response.data[1].id).toBe(assetA.id);
  });
});
