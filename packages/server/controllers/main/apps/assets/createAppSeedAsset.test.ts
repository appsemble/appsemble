import { createFormData } from '@appsemble/node-utils';
import { type Asset as AssetType } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMember,
  Asset,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
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
    role: 'Owner',
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

describe('createAppSeedAsset', () => {
  it('should create seed assets in all apps', async () => {
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: '',
      timezone: 'Europe/Amsterdam',
    });
    authorizeStudio();
    const response = await request.post<AssetType>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
    const asset = await Asset.findByPk(response.data.id);

    expect(asset.AppMemberId).toStrictEqual(member.id);
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

    const seedAsset = await Asset.findOne({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedAsset.dataValues).toMatchInlineSnapshot(
      {
        id: expect.any(String),
        AppMemberId: expect.any(String),
        created: expect.any(Date),
        updated: expect.any(Date),
      },
      `
      {
        "AppId": 1,
        "AppMemberId": Any<String>,
        "ResourceId": null,
        "clonable": false,
        "created": Any<Date>,
        "data": {
          "data": [],
          "type": "Buffer",
        },
        "ephemeral": false,
        "filename": null,
        "id": Any<String>,
        "mime": "application/octet-stream",
        "name": null,
        "seed": true,
        "updated": Any<Date>,
      }
    `,
    );
  });

  it('should create seed assets and ephemeral assets in demo apps', async () => {
    await app.update({ demoMode: true });
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: '',
      timezone: 'Europe/Amsterdam',
    });
    authorizeStudio();
    const response = await request.post<AssetType>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );
    const asset = await Asset.findByPk(response.data.id);

    expect(asset.AppMemberId).toStrictEqual(member.id);
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

    const seedAsset = await Asset.findOne({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedAsset.dataValues).toMatchInlineSnapshot(
      {
        id: expect.any(String),
        AppMemberId: expect.any(String),
        created: expect.any(Date),
        updated: expect.any(Date),
      },
      `
      {
        "AppId": 1,
        "AppMemberId": Any<String>,
        "ResourceId": null,
        "clonable": false,
        "created": Any<Date>,
        "data": {
          "data": [],
          "type": "Buffer",
        },
        "ephemeral": false,
        "filename": null,
        "id": Any<String>,
        "mime": "application/octet-stream",
        "name": null,
        "seed": true,
        "updated": Any<Date>,
      }
    `,
    );

    const ephemeralAsset = await Asset.findOne({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralAsset.dataValues).toMatchInlineSnapshot(
      {
        id: expect.any(String),
        AppMemberId: expect.any(String),
        created: expect.any(Date),
        updated: expect.any(Date),
      },
      `
      {
        "AppId": 1,
        "AppMemberId": Any<String>,
        "ResourceId": null,
        "clonable": false,
        "created": Any<Date>,
        "data": {
          "data": [],
          "type": "Buffer",
        },
        "ephemeral": true,
        "filename": null,
        "id": Any<String>,
        "mime": "application/octet-stream",
        "name": null,
        "seed": false,
        "updated": Any<Date>,
      }
    `,
    );
  });
});
