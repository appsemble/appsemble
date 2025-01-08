import { PredefinedAppRole, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  AppMember,
  Group,
  GroupMember,
  Organization,
  OrganizationMember,
  Resource,
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

describe('deleteAppResource', () => {
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

  it('should be able to delete an existing resource', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const responseGetA = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);

    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetB = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGetB).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });

  it('should soft-delete a resource', async () => {
    const { id } = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();

    const response = await request.delete(`/api/apps/${app.id}/resources/testResource/${id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    const deletedResource = await Resource.findByPk(id, { paranoid: false });
    expect(deletedResource).toMatchObject({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      deleted: expect.any(Date),
    });
  });

  it('should delete another group member’s resource', async () => {
    const group = await Group.create({ name: 'Test Group', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberA = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
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
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      AuthorId: memberB.id,
    });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceGroup/${resource.id}`,
    );

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not delete resources if not part of the same group', async () => {
    const group = await Group.create({ name: 'Test Group', AppId: app.id });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });

    const memberB = await AppMember.create({
      email: 'userB@example.com',
      AppId: app.id,
      UserId: userB.id,
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
      AppId: app.id,
      UserId: user.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });

    const resource = await Resource.create({
      type: 'testResourceGroup',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
      AuthorId: memberB.id,
    });

    authorizeAppMember(app, member);
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceGroup/${resource.id}?groupId=${group.id}`,
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

  it('should not be able to delete a non-existent resource', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/resources/testResource/0`);

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

  it('should not be possible to delete an existing resource through another resource', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceB/${resource.id}`,
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

    const responseGet = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);
  });

  it('should not be possible to delete an existing resource through another app', async () => {
    const resource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const appB = await exampleApp(organization.id, 'app-b');
    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${appB.id}/resources/testResource/${resource.id}`,
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

    const responseGet = await request.get(
      `/api/apps/${app.id}/resources/testResource/${resource.id}`,
    );

    expect(responseGet).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);
  });

  it('should allow organization app editors to delete resources using Studio', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not allow organization members to delete resources using Studio', async () => {
    await orgMember.update({
      role: PredefinedOrganizationRole.Member,
    });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
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

  it('should allow organization app editors to delete resources using client credentials', async () => {
    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not allow organization members to delete resources using client credentials', async () => {
    await orgMember.update({
      role: PredefinedOrganizationRole.Member,
    });

    const resource = await Resource.create({
      AppId: app.id,
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });
    await authorizeClientCredentials('resources:write');
    const response = await request.delete(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/${resource.id}`,
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

  it('should not be able to delete a resource if it is referenced by another resource without cascading strategy', async () => {
    const testResource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResourceB = await Resource.create({
      type: 'testResourceB',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource.id },
    });

    authorizeStudio();
    const responseGetTestResource = await request.get(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseGetTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);

    const responseGetTestResourceB = await request.get(
      `/api/apps/${app.id}/resources/testResourceB/${testResourceB.id}`,
    );

    expect(responseGetTestResourceB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I reference Foo.",
        "id": 2,
        "testResourceId": 1,
      }
    `);

    const responseDeleteTestResource = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseDeleteTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Cannot delete resource 1. There is a resource of type testResourceB that references it.",
        "statusCode": 400,
      }
    `);
  });

  it('should be able to delete a resource if it is referenced by another resource without cascading strategy if the referencing resource is deleted first', async () => {
    const testResource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResourceB = await Resource.create({
      type: 'testResourceB',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource.id },
    });

    authorizeStudio();
    const responseGetTestResource = await request.get(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseGetTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);

    const responseGetTestResourceB = await request.get(
      `/api/apps/${app.id}/resources/testResourceB/${testResourceB.id}`,
    );

    expect(responseGetTestResourceB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I reference Foo.",
        "id": 2,
        "testResourceId": 1,
      }
    `);

    authorizeStudio();
    const responseDeleteTestResourceB = await request.delete(
      `/api/apps/${app.id}/resources/testResourceB/${testResourceB.id}`,
    );

    expect(responseDeleteTestResourceB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseDeleteTestResource = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseDeleteTestResource).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should be able to delete a resource if it is referenced by another resource with cascading update strategy', async () => {
    const testResource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResourceC = await Resource.create({
      type: 'testResourceC',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource.id },
    });

    authorizeStudio();
    const responseGetTestResource = await request.get(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseGetTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);

    const responseGetTestResourceC = await request.get(
      `/api/apps/${app.id}/resources/testResourceC/${testResourceC.id}`,
    );

    expect(responseGetTestResourceC).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I reference Foo.",
        "id": 2,
        "testResourceId": 1,
      }
    `);

    const responseDeleteTestResource = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseDeleteTestResource).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetTestResourceCAfterDeletingTestResource = await request.get(
      `/api/apps/${app.id}/resources/testResourceC/${testResourceC.id}`,
    );

    expect(responseGetTestResourceCAfterDeletingTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I reference Foo.",
        "id": 2,
        "testResourceId": null,
      }
    `);
  });

  it('should be able to delete a resource if it is referenced by another resource with cascading delete strategy', async () => {
    const testResource = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResourceD = await Resource.create({
      type: 'testResourceD',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource.id },
    });

    authorizeStudio();
    const responseGetTestResource = await request.get(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseGetTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I am Foo.",
        "id": 1,
      }
    `);

    const responseGetTestResourceD = await request.get(
      `/api/apps/${app.id}/resources/testResourceD/${testResourceD.id}`,
    );

    expect(responseGetTestResourceD).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "foo": "I reference Foo.",
        "id": 2,
        "testResourceId": 1,
      }
    `);

    const responseDeleteTestResource = await request.delete(
      `/api/apps/${app.id}/resources/testResource/${testResource.id}`,
    );

    expect(responseDeleteTestResource).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetTestResourceDAfterDeletingTestResource = await request.get(
      `/api/apps/${app.id}/resources/testResourceD/${testResourceD.id}`,
    );

    expect(responseGetTestResourceDAfterDeletingTestResource).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Resource not found",
        "statusCode": 404,
      }
    `);
  });
});
