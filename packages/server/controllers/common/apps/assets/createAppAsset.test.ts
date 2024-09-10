import { createFixtureStream, createFormData } from '@appsemble/node-utils';
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

describe('createAppAsset', () => {
  it('should be able to create an asset', async () => {
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);
    const response = await request.post<Asset>(
      `/api/common/apps/${app.id}/assets`,
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
      AppMemberId: null,
    });
  });

  it('should not allow using conflicting names', async () => {
    await request.post(
      `/api/common/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0), name: 'conflict' }),
    );
    const response = await request.post(
      `/api/common/apps/${app.id}/assets`,
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
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should accept empty files', async () => {
    const response = await request.post(
      `/api/common/apps/${app.id}/assets`,
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
      `/api/common/apps/${app.id}/assets`,
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
      '/api/common/apps/0/assets',
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

  it('should associate the app member if the user is authenticated', async () => {
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: '',
      timezone: 'Europe/Amsterdam',
    });
    authorizeStudio();
    const response = await request.post<AssetType>(
      `/api/common/apps/${app.id}/assets`,
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
  });
});
