import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { createFormData, getS3FileBuffer } from '@appsemble/node-utils';
import { PredefinedOrganizationRole, type Resource as ResourceType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  App,
  AppMember,
  Asset,
  Organization,
  OrganizationMember,
  Resource,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeClientCredentials,
  authorizeStudio,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let orgMember: OrganizationMember;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

describe('createAppResource', () => {
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
    orgMember = await OrganizationMember.create({
      UserId: user.id,
      OrganizationId: organization.id,
      role: PredefinedOrganizationRole.Maintainer,
    });
    app = await exampleApp(organization.id);
  });

  afterAll(() => {
    webpush.sendNotification = originalSendNotification;
    vi.useRealTimers();
  });

  it('should be able to create a new resource', async () => {
    const resource = { foo: 'bar' };
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "bar",
        "id": 1,
      }
    `);
  });

  it('should validate resources', async () => {
    const resource = {};
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "foo",
              "instance": {},
              "message": "requires property "foo"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "properties": {
                  "$clonable": {
                    "type": "boolean",
                  },
                  "$expires": {
                    "anyOf": [
                      {
                        "format": "date-time",
                        "type": "string",
                      },
                      {
                        "pattern": "^(\\d+(y|yr|years))?\\s*(\\d+months)?\\s*(\\d+(w|wk|weeks))?\\s*(\\d+(d|days))?\\s*(\\d+(h|hr|hours))?\\s*(\\d+(m|min|minutes))?\\s*(\\d+(s|sec|seconds))?$",
                        "type": "string",
                      },
                    ],
                  },
                  "$thumbnails": {
                    "items": {
                      "format": "binary",
                      "type": "string",
                    },
                    "type": "array",
                  },
                  "array": {
                    "type": "array",
                  },
                  "bar": {
                    "type": "string",
                  },
                  "baz": {
                    "type": "string",
                  },
                  "boolean": {
                    "type": "boolean",
                  },
                  "date": {
                    "format": "date",
                    "type": "string",
                  },
                  "enum": {
                    "enum": [
                      "A",
                      "B",
                    ],
                  },
                  "foo": {
                    "type": "string",
                  },
                  "fooz": {
                    "type": "string",
                  },
                  "id": {
                    "type": "integer",
                  },
                  "integer": {
                    "type": "integer",
                  },
                  "number": {
                    "type": "number",
                  },
                  "object": {
                    "type": "object",
                  },
                },
                "required": [
                  "foo",
                ],
                "type": "object",
              },
              "stack": "instance requires property "foo"",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Resource validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should check if an app has a specific resource definition', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/thisDoesNotExist`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have resources called thisDoesNotExist",
        "statusCode": 404,
      }
    `);
  });

  it('should check if an app has any resource definitions', async () => {
    const appA = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app-A',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${appA.id}/resources/thisDoesNotExist`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have resources called thisDoesNotExist",
        "statusCode": 404,
      }
    `);
  });

  it('should calculate resource expiration', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:10:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "test",
        "id": 1,
      }
    `);
  });

  it('should set resource expiration', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:05:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "test",
        "id": 1,
      }
    `);
  });

  it('should not set resource expiration if given date has already passed', async () => {
    // 10 minutes
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.advanceTimersByTime(600e3);

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "instance": "1970-01-01T00:05:00.000Z",
              "message": "has already passed",
              "path": [
                "$expires",
              ],
              "property": "instance.$expires",
              "stack": "instance.$expires has already passed",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Resource validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should accept assets as form data', async () => {
    vi.useRealTimers();
    authorizeStudio();
    const assetContent = Buffer.from('Test resource a');
    const response = await request.post<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: assetContent,
      }),
    );

    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual(
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );
    const assets = await Asset.findAll({ where: { ResourceId: response.data.id }, raw: true });
    expect(assets).toStrictEqual([
      expect.objectContaining({
        AppId: app.id,
        ResourceId: 1,
        clonable: false,
        AppMemberId: null,
        GroupId: null,
        deleted: null,
        ephemeral: false,
        filename: null,
        id: response.data.file,
        mime: 'application/octet-stream',
        name: null,
        seed: false,
      }),
    ]);
    expect(await getS3FileBuffer(`app-${app.id}`, assets[0].id)).toStrictEqual(assetContent);
  });

  it('should disallow unused files', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { string: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "format",
              "instance": 0,
              "message": "is not referenced from the resource",
              "name": "binary",
              "path": [
                "assets",
                0,
              ],
              "property": "instance.assets[0]",
              "stack": "instance.assets[0] is not referenced from the resource",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Resource validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should disallow duplicate file references', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0', file2: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "binary",
              "instance": "0",
              "message": "does not conform to the "binary" format",
              "name": "format",
              "path": [
                "file2",
              ],
              "property": "instance.file2",
              "schema": {
                "format": "binary",
                "type": "string",
              },
              "stack": "instance.file2 does not conform to the "binary" format",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Resource validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should accept an array of resources', async () => {
    authorizeStudio();
    const response = await request.post<ResourceType>(
      `/api/apps/${app.id}/resources/testResource`,
      [{ foo: 'bar' }, { foo: 'baz' }],
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 2,
        },
      ]
    `);
  });

  it('should accept assets as form data with multiple resources', async () => {
    vi.useRealTimers();
    authorizeStudio();
    const assetAContent = Buffer.from('Test resource a');
    const assetBContent = Buffer.from('Test resource b');

    const response = await request.post<ResourceType[]>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: [{ file: '0' }, { file: '1' }],
        assets: [assetAContent, assetBContent],
      }),
    );

    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    ]);
    const assets = await Asset.findAll({ raw: true });
    const assetAId = response.data[0].file as string;
    const assetBId = response.data[1].file as string;
    expect(assets).toStrictEqual([
      expect.objectContaining({
        AppId: app.id,
        ResourceId: 1,
        AppMemberId: null,
        GroupId: null,
        clonable: false,
        created: expect.any(Date),
        deleted: null,
        ephemeral: false,
        filename: null,
        id: assetAId,
        mime: 'application/octet-stream',
        name: null,
        seed: false,
        updated: expect.any(Date),
      }),
      expect.objectContaining({
        AppId: app.id,
        ResourceId: 2,
        AppMemberId: null,
        GroupId: null,
        clonable: false,
        created: expect.any(Date),
        deleted: null,
        ephemeral: false,
        filename: null,
        id: assetBId,
        mime: 'application/octet-stream',
        name: null,
        seed: false,
        updated: expect.any(Date),
      }),
    ]);

    expect(await getS3FileBuffer(`app-${app.id}`, assetAId)).toStrictEqual(assetAContent);
    expect(await getS3FileBuffer(`app-${app.id}`, assetBId)).toStrictEqual(assetBContent);
  });

  it('should block unknown asset references', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '1' },
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "binary",
              "instance": "1",
              "message": "does not conform to the "binary" format",
              "name": "format",
              "path": [
                "file",
              ],
              "property": "instance.file",
              "schema": {
                "format": "binary",
                "type": "string",
              },
              "stack": "instance.file does not conform to the "binary" format",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Resource validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should allow organization app editors to create resources using Studio', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        }
      `,
    );
  });

  it('should not allow organization members to create resources using Studio', async () => {
    await orgMember.update({
      role: PredefinedOrganizationRole.Member,
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow organization app editors to create resources using client credentials', async () => {
    await authorizeClientCredentials('resources:write');
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        }
      `,
    );
  });

  it('should not allow organization members to create resources using client credentials', async () => {
    await orgMember.update({
      role: PredefinedOrganizationRole.Member,
    });

    await authorizeClientCredentials('resources:write');
    const response = await request.post(`/api/apps/${app.id}/resources/testResourceAuthorOnly`, {
      foo: 'bar',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should accept text/csv', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/resources/testResource`,
      stripIndent(`
        foo,bar,integer,boolean,number,object,array\r
        a,b,42,true,3.14,{},[]\r
        A,B,1337,false,9.8,{},[]\r
      `)
        .replace(/^\s+/, '')
        .replaceAll(/ +$/g, ''),
      { headers: { 'content-type': 'text/csv' } },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "array": [],
          "bar": "b",
          "boolean": true,
          "foo": "a",
          "id": 1,
          "integer": 42,
          "number": 3.14,
          "object": {},
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "array": [],
          "bar": "B",
          "boolean": false,
          "foo": "A",
          "id": 2,
          "integer": 1337,
          "number": 9.8,
          "object": {},
        },
      ]
    `);
  });

  it('should support custom delimiter for text/csv', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/resources/testResource`,
      stripIndent(`
        foo;bar;integer;boolean;number;object;array\r
        a;b;42;true;3.14;{};[]\r
        A;B;1337;false;9.8;{};[]\r
      `)
        .replace(/^\s+/, '')
        .replaceAll(/ +$/g, ''),
      { headers: { 'content-type': 'text/csv' }, params: { delimiter: ';' } },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "array": [],
          "bar": "b",
          "boolean": true,
          "foo": "a",
          "id": 1,
          "integer": 42,
          "number": 3.14,
          "object": {},
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "array": [],
          "bar": "B",
          "boolean": false,
          "foo": "A",
          "id": 2,
          "integer": 1337,
          "number": 9.8,
          "object": {},
        },
      ]
    `);
  });

  it("should assign the user's AppMember account to the resource", async () => {
    const member = await AppMember.create({
      email: user.primaryEmail,
      UserId: user.id,
      AppId: app.id,
      role: PredefinedAppRole.ResourcesManager,
      timezone: 'Europe/Amsterdam',
    });
    authorizeAppMember(app, member);

    const resource = { foo: 'bar' };
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        }
      `,
    );
    const foundResource = (await Resource.findByPk(response.data.id))!;
    expect(foundResource.dataValues.AuthorId).toBe(member.id);
  });

  it('should create ephemeral resources in demo apps', async () => {
    authorizeStudio();
    await app.update({
      demoMode: true,
    });

    const resource = { foo: 'bar' };
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource);

    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$ephemeral": true,
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "bar",
          "id": 1,
        }
      `,
    );

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
        "id": 1,
      }
    `);
  });

  it('should create ephemeral resources with ephemeral assets in demo apps', async () => {
    vi.useRealTimers();
    authorizeStudio();
    await app.update({
      demoMode: true,
    });

    const response = await request.post<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual(
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        $ephemeral: true,
      }),
    );

    const ephemeralResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralResources.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        $ephemeral: true,
      }),
    ]);

    const ephemeralAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralAssets.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        seed: false,
        ephemeral: true,
        clonable: false,
      }),
    ]);
    const ephemeraAssetsData = await Promise.all(
      ephemeralAssets.map((asset) => getS3FileBuffer(`app-${app.id}`, asset.id)),
    );
    expect(Buffer.from('Test resource a').equals(ephemeraAssetsData[0])).toBe(true);
  });

  it('should create seed resources in all apps', async () => {
    authorizeStudio();

    const resource = { foo: 'bar' };
    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource, {
      params: { seed: true },
    });

    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
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

    const response = await request.post(`/api/apps/${app.id}/resources/testResource`, resource, {
      params: { seed: true },
    });

    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
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
    vi.useRealTimers();
    authorizeStudio();

    const response = await request.post<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.from('Test resource a'),
      }),
      { params: { seed: true } },
    );

    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual(
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    );

    const seedResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedResources.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    ]);

    const seedAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: true,
        deleted: null,
        ephemeral: false,
      },
    });
    expect(seedAssets.map((a) => a.toJSON())).toStrictEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        seed: true,
        ephemeral: false,
        clonable: false,
      }),
    ]);
    const seedAssetsData = await Promise.all(
      seedAssets.map((asset) => getS3FileBuffer(`app-${app.id}`, asset.id)),
    );
    expect(Buffer.from('Test resource a').equals(seedAssetsData[0])).toBe(true);
  });

  it.todo('should create resources with Positioning and grouped Positions', async () => {
    const testApp = await App.create({
      OrganizationId: organization.id,
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {},
        enforceOrderingGroupByFields: ['foo'],
        resources: {
          testResource: {
            positioning: true,
            schema: {
              type: 'object',
              required: ['foo'],
              properties: {
                foo: {
                  type: 'string',
                },
              },
            },
          },
        },
        pages: [],
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });
    const appMember = await createTestAppMember(
      testApp.id,
      user.primaryEmail,
      PredefinedAppRole.Owner,
    );
    authorizeAppMember(app, appMember);
    const resources = Array.from({ length: 10 })
      .keys()
      .map((item) => ({ foo: `foo ${item}`, bar: item % 2 === 0 ? item + 1 : null }));
    await request.post<ResourceType>(`api/apps/${testApp.id}/resources/testResource`, resources);
  });

  it('should create seed resources with assets and ephemeral resources with assets in demo apps', async () => {
    vi.useRealTimers();
    authorizeStudio();
    await app.update({
      demoMode: true,
    });

    const response = await request.post<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets`,
      createFormData({
        resource: { file: '0' },
        assets: [Buffer.from('Test asset')],
      }),
      { params: { seed: true } },
    );

    expect(response.status).toBe(201);
    expect(response.data).toStrictEqual(
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        $ephemeral: true,
      }),
    );

    const seedResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedResources.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
      }),
    ]);

    const seedAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedAssets.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        seed: true,
        ephemeral: false,
        clonable: false,
      }),
    ]);
    const seedAssetsData = await Promise.all(
      seedAssets.map((asset) => getS3FileBuffer(`app-${app.id}`, asset.id)),
    );
    expect(Buffer.from('Test asset').equals(seedAssetsData[0])).toBe(true);

    const ephemeralResources = await Resource.findAll({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralResources.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        $ephemeral: true,
      }),
    ]);

    const ephemeralAssets = await Asset.findAll({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralAssets.map((r) => r.toJSON())).toStrictEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/),
        seed: false,
        ephemeral: true,
        clonable: false,
      }),
    ]);
    const ephemeralAssetsData = await Promise.all(
      ephemeralAssets.map((asset) => getS3FileBuffer(`app-${app.id}`, asset.id)),
    );
    expect(Buffer.from('Test asset').equals(ephemeralAssetsData[0])).toBe(true);
  });
});
