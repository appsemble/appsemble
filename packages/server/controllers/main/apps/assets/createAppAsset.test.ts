import { createFixtureStream, createFormData, getS3FileBuffer } from '@appsemble/node-utils';
import { type Asset as AssetType, PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  type Asset,
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

describe('createAppAsset', () => {
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

  it('should be able to create an asset', async () => {
    authorizeStudio();
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

    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.findByPk(response.data.id);
    expect(asset).toMatchObject({
      filename: null,
      mime: 'application/octet-stream',
      name: 'test-asset',
      AppMemberId: null,
    });
  });

  it('should save files to s3', async () => {
    authorizeStudio();
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);
    const response = await request.post<Asset>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: data, name: 'test-asset' }),
    );
    expect(await getS3FileBuffer(`app-${app.id}`, response.data.id)).toStrictEqual(data);
  });

  it('should not allow using conflicting names', async () => {
    authorizeStudio();
    const { Asset } = await getAppDB(app.id);
    await Asset.create({
      data: Buffer.alloc(0),
      name: 'conflict',
    });
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

  it('should not allow if user has insufficient permissions', async () => {
    authorizeStudio();
    await OrganizationMember.update(
      { role: 'Member' },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );
    const response = await request.post(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
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

  it('should accept empty files', async () => {
    authorizeStudio();
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
    authorizeStudio();
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
    authorizeStudio();
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

  it('should create seed assets in all apps', async () => {
    authorizeStudio();
    const response = await request.post<AssetType>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.from('Test asset') }),
      { params: { seed: 'true' } },
    );
    const { Asset } = await getAppDB(app.id);
    const asset = (await Asset.findByPk(response.data.id))!;

    expect(asset.AppMemberId).toBeNull();
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

    const seedAsset = (await Asset.findOne({
      where: {
        seed: true,
        ephemeral: false,
      },
    }))!;
    expect(seedAsset.dataValues).toStrictEqual(
      expect.objectContaining({
        id: expect.any(String),
        created: expect.any(Date),
        updated: expect.any(Date),
        AppMemberId: null,
        GroupId: null,
        ResourceId: null,
        clonable: false,
        deleted: null,
        ephemeral: false,
        filename: null,
        mime: 'application/octet-stream',
        name: null,
        seed: true,
      }),
    );
  });

  it('should create seed assets and ephemeral assets in demo apps', async () => {
    await app.update({ demoMode: true });
    authorizeStudio();
    const response = await request.post<AssetType>(
      `/api/apps/${app.id}/assets?seed=true`,
      createFormData({ file: Buffer.from('Test asset') }),
    );
    const { Asset } = await getAppDB(app.id);
    const asset = (await Asset.findByPk(response.data.id))!;

    expect(asset.AppMemberId).toBeNull();
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

    const seedAsset = (await Asset.findOne({
      where: {
        seed: true,
        ephemeral: false,
      },
    }))!;
    expect(seedAsset.dataValues).toStrictEqual(
      expect.objectContaining({
        id: expect.any(String),
        created: expect.any(Date),
        updated: expect.any(Date),
        AppMemberId: null,
        GroupId: null,
        ResourceId: null,
        clonable: false,
        deleted: null,
        ephemeral: false,
        filename: null,
        mime: 'application/octet-stream',
        name: null,
        seed: true,
      }),
    );

    const ephemeralAsset = (await Asset.findOne({
      where: {
        seed: false,
        ephemeral: true,
      },
    }))!;
    expect(ephemeralAsset.dataValues).toStrictEqual(
      expect.objectContaining({
        id: expect.any(String),
        created: expect.any(Date),
        updated: expect.any(Date),
        AppMemberId: null,
        GroupId: null,
        ResourceId: null,
        clonable: false,
        deleted: null,
        ephemeral: true,
        filename: null,
        mime: 'application/octet-stream',
        name: null,
        seed: false,
      }),
    );
  });
});
