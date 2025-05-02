import { createFormData, getS3FileBuffer } from '@appsemble/node-utils';
import {
  PredefinedAppRole,
  PredefinedOrganizationRole,
  type Resource as ResourceType,
} from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  getAppDB,
  Organization,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;
let orgMember: OrganizationMember;

describe('patchAppResource', () => {
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

  it('should be able to patch an existing resource', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.', bar: 'I am Bar.' },
    });

    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.advanceTimersByTime(20e3);

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 200 OK
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "bar": "I am Bar.",
          "foo": "I am not Foo.",
          "id": 1,
        }
      `,
    );

    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseB).toMatchInlineSnapshot(
      `
        HTTP/1.1 200 OK
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:20.000Z",
          "bar": "I am Bar.",
          "foo": "I am not Foo.",
          "id": 1,
        }
      `,
    );
  });

  it('should be able to patch an existing resource from another group', async () => {
    const { AppMember, Group, GroupMember, Resource } = await getAppDB(app.id);
    const group = await Group.create({ name: 'Test Group' });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      userId: user.id,
      name: user.name,
      role: PredefinedAppRole.ResourcesManager,
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      timezone: 'Europe/Amsterdam',
      userId: userB.id,
      name: userB.name,
      role: PredefinedAppRole.Member,
    });

    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: memberA.id,
      role: 'Member',
    });
    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: memberB.id,
      role: 'Member',
    });

    const resource = await Resource.create({
      type: 'testResourceGroup',
      data: { foo: 'I am Foo.' },
      AuthorId: memberB.id,
    });

    authorizeAppMember(app, memberA);
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceGroup/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          $author: { id: expect.any(String) },
          $editor: { id: expect.any(String) },
        },
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$author": {
          "id": Any<String>,
          "name": null,
        },
        "$created": "1970-01-01T00:00:00.000Z",
        "$editor": {
          "id": Any<String>,
          "name": "Test User",
        },
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am not Foo.",
        "id": 1,
      }
    `,
    );
  });

  it('should not be able to patch an existing resource from another group if not part of the group', async () => {
    const { AppMember, Group, GroupMember, Resource } = await getAppDB(app.id);
    const group = await Group.create({ name: 'Test Group' });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberB = await AppMember.create({
      email: 'userB@example.com',
      userId: userB.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });

    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: memberB.id,
      role: 'Member',
    });
    const member = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });

    const resource = await Resource.create({
      type: 'testResourceGroup',
      data: { foo: 'I am Foo.' },
      AuthorId: memberB.id,
    });

    authorizeAppMember(app, member);
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceGroup/${resource.id}?groupId=${group.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App member does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not be possible to patch an existing resource through another resource', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceB/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be possible to patch an existing resource through another app', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
    });

    const appB = await exampleApp(organization.id, 'app-b');

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.' },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not be possible to patch a non-existent resource', async () => {
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/resources/testResource/0`, {
      foo: 'I am not Foo.',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should validate resources', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { bar: 123 },
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": [
                "string",
              ],
              "instance": 123,
              "message": "is not of a type(s) string",
              "name": "type",
              "path": [
                "bar",
              ],
              "property": "instance.bar",
              "schema": {
                "type": "string",
              },
              "stack": "instance.bar is not of a type(s) string",
            },
          ],
        },
        "error": "Bad Request",
        "message": "Resource validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should set clonable if specified in the request', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am not Foo.', $clonable: true },
    );

    await resource.reload();

    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 200 OK
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am not Foo.",
          "id": 1,
        }
      `,
    );
    expect(resource.clonable).toBe(true);
  });

  it('should set $expires', async () => {
    authorizeStudio();
    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
      $expires: '1970-01-01T00:05:00.000Z',
    });

    const responseA = await request.patch(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
      {
        foo: 'updated',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    );
    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
    );

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:07:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "updated",
        "id": 1,
      }
    `);

    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$expires": "1970-01-01T00:07:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "updated",
        "id": 1,
      }
    `);
  });

  it('should not set $expires if the date has already passed', async () => {
    // 10 minutes
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.advanceTimersByTime(600e3);
    authorizeStudio();

    const {
      data: { id },
    } = await request.post<ResourceType>(`/api/apps/${app.id}/resources/testExpirableResource`, {
      foo: 'test',
    });

    const response = await request.patch(
      `/api/apps/${app.id}/resources/testExpirableResource/${id}`,
      {
        foo: 'updated',
        $expires: '1970-01-01T00:07:00.000Z',
      },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "instance": "1970-01-01T00:07:00.000Z",
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
    const { Asset, Resource } = await getAppDB(app.id);
    const resource = await Resource.create({ type: 'testAssets', data: {} });
    authorizeStudio();
    const response = await request.patch<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({
        resource: { file: '0' },
        assets: Buffer.from('Test resource a'),
      }),
    );

    const { $created, $updated, ...rest } = response.data;
    response.data = rest as ResourceType;

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 1,
      }
    `,
    );
    const assets = await Asset.findAll({ where: { ResourceId: response.data.id }, raw: true });
    expect(assets).toStrictEqual([
      expect.objectContaining({
        ResourceId: 1,
        AppMemberId: null,
        GroupId: null,
        clonable: false,
        deleted: null,
        ephemeral: false,
        seed: false,
        filename: null,
        id: response.data.file,
        mime: 'application/octet-stream',
        name: null,
      }),
    ]);
    const assetsData = await Promise.all(
      assets.map((asset) => getS3FileBuffer(`app-${app.id}`, asset.id)),
    );
    expect(Buffer.from('Test resource a').equals(assetsData[0])).toBe(true);
  });

  it('should disallow unused assets', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({ type: 'testAssets', data: {} });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
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

  it('should block unknown asset references', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({ type: 'testAssets', data: {} });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
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

  it('should allow referencing existing assets', async () => {
    const { Asset, Resource } = await getAppDB(app.id);
    const resource = await Resource.create({ type: 'testAssets', data: {} });
    const asset = await Asset.create({
      ResourceId: resource.id,
      data: Buffer.alloc(0),
    });
    authorizeStudio();
    const response = await request.patch<ResourceType>(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({ resource: { file: asset.id } }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": Any<String>,
        "id": 1,
      }
    `,
    );
    expect(response.data.file).toBe(asset.id);
  });

  it('should delete dereferenced assets', async () => {
    const { Asset, Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testAssets',
      data: { file: 'test-asset' },
    });
    const asset = await Asset.create({
      name: 'test-asset',
      ResourceId: resource.id,
      data: Buffer.alloc(0),
    });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testAssets/${resource.id}`,
      createFormData({ resource: { file: '0' }, assets: Buffer.alloc(1) }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { file: expect.stringMatching(/^[0-f]{8}(?:-[0-f]{4}){3}-[0-f]{12}$/) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "file": StringMatching /\\^\\[0-f\\]\\{8\\}\\(\\?:-\\[0-f\\]\\{4\\}\\)\\{3\\}-\\[0-f\\]\\{12\\}\\$/,
        "id": 1,
      }
    `,
    );
    await expect(() => asset.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should allow organization app editors to patch resources using Studio', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 200 OK
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 1,
        }
      `,
    );
  });

  it('should not allow organization members to patch resources using Studio', async () => {
    await orgMember.update({
      role: PredefinedOrganizationRole.Member,
    });

    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
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

  it('should allow organization app editors to patch resources using client credentials', async () => {
    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
    expect(response).toMatchInlineSnapshot(
      `
        HTTP/1.1 200 OK
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "baz",
          "id": 1,
        }
      `,
    );
  });

  it('should not allow organization members to patch resources using client credentials', async () => {
    await orgMember.update({
      role: PredefinedOrganizationRole.Member,
    });

    const { Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
      { foo: 'baz' },
    );
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

  it('should set the updater', async () => {
    const { AppMember, Resource } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testResource',
      data: { foo: 'I am Foo.' },
    });

    const member = await AppMember.create({
      email: user.primaryEmail,
      timezone: 'Europe/Amsterdam',
      userId: user.id,
      name: user.name,
      role: PredefinedAppRole.ResourcesManager,
    });

    authorizeAppMember(app, member);
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
      { foo: 'I am Foo too!' },
    );
    expect(response).toMatchInlineSnapshot(
      { data: { $editor: { id: expect.any(String) } } },
      `
        HTTP/1.1 200 OK
        Content-Type: application/json; charset=utf-8

        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$editor": {
            "id": Any<String>,
            "name": "Test User",
          },
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo too!",
          "id": 1,
        }
      `,
    );

    await resource.reload();
    expect(resource.EditorId).toBe(member.id);
  });

  it('should keep an old resource version including data if history is true', async () => {
    const { Resource, ResourceVersion } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testHistoryTrue',
      data: { string: 'rev1' },
    });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testHistoryTrue/${resource.id}`,
      { string: 'rev2' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "id": 1,
        "string": "rev2",
      }
    `);
    await resource.reload();
    expect(resource.data).toStrictEqual({
      string: 'rev2',
    });
    const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
    expect(resourceVersion).toStrictEqual({
      ResourceId: resource.id,
      AppMemberId: null,
      created: new Date(),
      data: { string: 'rev1' },
      id: expect.stringMatching(uuid4Pattern),
    });
  });

  it('should keep an old resource version including data if history.data is true', async () => {
    const { Resource, ResourceVersion } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testHistoryDataTrue',
      data: { string: 'rev1' },
    });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testHistoryDataTrue/${resource.id}`,
      { string: 'rev2' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "id": 1,
        "string": "rev2",
      }
    `);
    await resource.reload();
    expect(resource.data).toStrictEqual({
      string: 'rev2',
    });
    const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
    expect(resourceVersion).toStrictEqual({
      ResourceId: resource.id,
      AppMemberId: null,
      created: new Date(),
      data: { string: 'rev1' },
      id: expect.stringMatching(uuid4Pattern),
    });
  });

  it('should keep an old resource version excluding data if history.data is false', async () => {
    const { Resource, ResourceVersion } = await getAppDB(app.id);
    const resource = await Resource.create({
      type: 'testHistoryDataFalse',
      data: { string: 'rev1' },
    });
    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}/resources/testHistoryDataFalse/${resource.id}`,
      { string: 'rev2' },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "id": 1,
        "string": "rev2",
      }
    `);
    await resource.reload();
    expect(resource.data).toStrictEqual({
      string: 'rev2',
    });
    const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
    expect(resourceVersion).toStrictEqual({
      ResourceId: resource.id,
      AppMemberId: null,
      created: new Date(),
      data: null,
      id: expect.stringMatching(uuid4Pattern),
    });
  });
});
