import { createFormData } from '@appsemble/node-utils';
import { type Resource as ResourceType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  Asset,
  Organization,
  OrganizationMember,
  Resource,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
  originalSendNotification = webpush.sendNotification;
});

beforeEach(async () => {
  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  vi.clearAllTimers();
  vi.setSystemTime(0);
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    UserId: user.id,
    OrganizationId: organization.id,
    role: 'Maintainer',
  });
  app = await exampleApp(organization.id);
});

afterAll(() => {
  webpush.sendNotification = originalSendNotification;
  vi.useRealTimers();
});

describe('createAppSeedResource', () => {
  it('should create seed resources in all apps', async () => {
    authorizeStudio();

    const resource = { foo: 'bar' };
    const response = await request.post(
      `/api/main/apps/${app.id}/resources/testResource`,
      resource,
    );

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `,
    );

    const seedResource = await Resource.findOne({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedResource).toMatchInlineSnapshot(`
      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should create seed resources and ephemeral resources in demo apps', async () => {
    authorizeStudio();
    await app.update({
      demoMode: true,
    });

    const resource = { foo: 'bar' };
    const response = await request.post(
      `/api/main/apps/${app.id}/resources/testResource`,
      resource,
    );

    expect(response).toMatchInlineSnapshot(
      { data: { $author: { id: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$ephemeral": true,
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 2,
      }
    `,
    );

    const seedResource = await Resource.findOne({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedResource).toMatchInlineSnapshot(`
      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);

    const ephemeralResource = await Resource.findOne({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralResource).toMatchInlineSnapshot(`
      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$ephemeral": true,
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 2,
      }
    `);
  });

  it('should create seed resources with assets in all apps', async () => {
    authorizeStudio();

    const response = await request.post<ResourceType>(
      `/api/main/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.alloc(0),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          $author: { id: expect.any(String) },
          file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 1,
      }
    `,
    );

    const seedResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedResources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      ],
      `
      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "id": 1,
        },
      ]
    `,
    );

    const seedAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedAssets.map((a) => a.toJSON())).toMatchInlineSnapshot(
      [
        {
          id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
          AppMemberId: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      ],
      `
      [
        {
          "AppId": 1,
          "AppMemberId": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "ResourceId": 1,
          "clonable": false,
          "created": 1970-01-01T00:00:00.000Z,
          "data": {
            "data": [],
            "type": "Buffer",
          },
          "ephemeral": false,
          "filename": null,
          "id": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "name": null,
          "seed": true,
          "updated": 1970-01-01T00:00:00.000Z,
        },
      ]
    `,
    );
  });

  it('should create seed resources with assets and ephemeral resources with assets in demo apps', async () => {
    authorizeStudio();
    await app.update({
      demoMode: true,
    });

    const response = await request.post<ResourceType>(
      `/api/main/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.alloc(0),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          $author: { id: expect.any(String) },
          file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$ephemeral": true,
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 2,
      }
    `,
    );

    const seedResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedResources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      ],
      `
      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "id": 1,
        },
      ]
    `,
    );

    const seedAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedAssets.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
          AppMemberId: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      ],
      `
      [
        {
          "AppId": 1,
          "AppMemberId": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "ResourceId": 1,
          "clonable": false,
          "created": 1970-01-01T00:00:00.000Z,
          "data": {
            "data": [],
            "type": "Buffer",
          },
          "ephemeral": false,
          "filename": null,
          "id": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "name": null,
          "seed": true,
          "updated": 1970-01-01T00:00:00.000Z,
        },
      ]
    `,
    );

    const ephemeralResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralResources.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      ],
      `
      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$ephemeral": true,
          "$updated": "1970-01-01T00:00:00.000Z",
          "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "id": 2,
        },
      ]
    `,
    );

    const ephemeralAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralAssets.map((r) => r.toJSON())).toMatchInlineSnapshot(
      [
        {
          id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
          AppMemberId: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        },
      ],
      `
      [
        {
          "AppId": 1,
          "AppMemberId": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "ResourceId": 2,
          "clonable": false,
          "created": 1970-01-01T00:00:00.000Z,
          "data": {
            "data": [],
            "type": "Buffer",
          },
          "ephemeral": true,
          "filename": null,
          "id": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
          "name": null,
          "seed": false,
          "updated": 1970-01-01T00:00:00.000Z,
        },
      ]
    `,
    );
  });
});
