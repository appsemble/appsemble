import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';

import {
  type App,
  AppMember,
  Organization,
  OrganizationMember,
  Resource,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

describe('deleteAppResources', () => {
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
      role: PredefinedOrganizationRole.Maintainer,
    });
    app = await exampleApp(organization.id);
  });

  afterAll(() => {
    webpush.sendNotification = originalSendNotification;
    vi.useRealTimers();
  });

  it('should be able to delete multiple resources', async () => {
    const resourceA = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });
    const resourceB = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Too.' },
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Three.' },
    });

    authorizeStudio();

    const responseGetA = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(responseGetA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo.",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo Too.",
          "id": 2,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo Three.",
          "id": 3,
        },
      ]
    `);

    const response = await request.delete(`/api/apps/${app.id}/resources/testResource`, {
      data: [resourceA.id, resourceB.id],
    });
    const responseGetEmpty = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseGetEmpty).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo Three.",
          "id": 3,
        },
      ]
    `);
  });

  it('should soft-delete resources', async () => {
    const resourceA = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });
    const resourceB = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Too.' },
    });
    await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Three.' },
    });

    authorizeStudio();
    const resourceIds = [resourceA.id, resourceB.id];

    const response = await request.delete(`/api/apps/${app.id}/resources/testResource`, {
      data: resourceIds,
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const resources = await Resource.findAll({
      where: {
        id: resourceIds,
      },
      paranoid: false,
    });
    expect(resources).toMatchObject([
      {
        type: 'testResource',
        AppId: app.id,
        data: { foo: 'I am Foo.' },
        deleted: expect.any(Date),
      },
      {
        type: 'testResource',
        AppId: app.id,
        data: { foo: 'I am Foo Too.' },
        deleted: expect.any(Date),
      },
    ]);
  });

  it('should delete large number of resources', async () => {
    const resources = await Resource.bulkCreate(
      Array.from({ length: 1000 }, (unused, i) => ({
        type: 'testResource',
        AppId: app.id,
        data: { foo: `I am Foo ${i}.` },
      })),
    );
    expect(resources).toHaveLength(1000);
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/resources/testResource`, {
      data: resources.map((r) => r.id),
    });
    const responseGetEmpty = await request.get(`/api/apps/${app.id}/resources/testResource`);
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseGetEmpty).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  }, 60_000);

  it('should ignore non-existent resources.', async () => {
    const resourceA = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/resources/testResource`, {
      data: [resourceA.id, 2, 3, 4, 5],
    });
    const responseGetEmpty = await request.get(`/api/apps/${app.id}/resources/testResource`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseGetEmpty).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });

  it('should not be able to delete multiple resources if they are referenced by another resource without cascading strategy', async () => {
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: PredefinedAppRole.ResourcesManager,
      timezone: 'Europe/Amsterdam',
    });
    const testResource1 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResource2 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Too.' },
    });

    await Resource.create({
      type: 'testResourceB',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource1.id },
    });

    await Resource.create({
      type: 'testResourceB',
      AppId: app.id,
      data: { foo: 'I reference Foo Two.', testResourceId: testResource2.id },
    });

    authorizeAppMember(app, member);

    const responseGetTestResources = await request.get(
      `/api/apps/${app.id}/resources/testResource`,
    );
    expect(responseGetTestResources.data).toMatchObject([
      {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        foo: 'I am Foo.',
        id: 1,
      },
      {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        foo: 'I am Foo Too.',
        id: 2,
      },
    ]);

    const responseGetTestResourcesB = await request.get(
      `/api/apps/${app.id}/resources/testResourceB`,
    );
    expect(responseGetTestResourcesB).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo.',
          id: 3,
          testResourceId: 1,
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo Two.',
          id: 4,
          testResourceId: 2,
        },
      ]),
    });

    const responseDeleteTestResources = await request.delete(
      `/api/apps/${app.id}/resources/testResource`,
      {
        data: [testResource1.id, testResource2.id],
      },
    );

    expect(responseDeleteTestResources).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Cannot delete resource 1. There is a resource of type testResourceB that references it.",
        "statusCode": 400,
      }
    `);
  });

  it('should be able to delete multiple resources if they are referenced by another resource without cascading strategy if the referencing resources are deleted first', async () => {
    const testResource1 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResource2 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Too.' },
    });

    const testResourceB1 = await Resource.create({
      type: 'testResourceB',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource1.id },
    });

    const testResourceB2 = await Resource.create({
      type: 'testResourceB',
      AppId: app.id,
      data: { foo: 'I reference Foo Two.', testResourceId: testResource2.id },
    });

    authorizeStudio();
    const responseGetTestResources = await request.get(
      `/api/apps/${app.id}/resources/testResource`,
    );
    expect(responseGetTestResources.data).toMatchObject([
      {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        foo: 'I am Foo.',
        id: 1,
      },
      {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        foo: 'I am Foo Too.',
        id: 2,
      },
    ]);

    const responseGetTestResourcesB = await request.get(
      `/api/apps/${app.id}/resources/testResourceB`,
    );
    expect(responseGetTestResourcesB).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo.',
          id: 3,
          testResourceId: 1,
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo Two.',
          id: 4,
          testResourceId: 2,
        },
      ]),
    });

    const responseDeleteTestResourcesB = await request.delete(
      `/api/apps/${app.id}/resources/testResourceB`,
      {
        data: [testResourceB1.id, testResourceB2.id],
      },
    );

    expect(responseDeleteTestResourcesB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseDeleteTestResources = await request.delete(
      `/api/apps/${app.id}/resources/testResource`,
      {
        data: [testResource1.id, testResource2.id],
      },
    );

    expect(responseDeleteTestResources).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should be able to delete multiple resources if they are referenced by another resource with cascading update strategy', async () => {
    const testResource1 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResource2 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Too.' },
    });

    await Resource.create({
      type: 'testResourceC',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource1.id },
    });

    await Resource.create({
      type: 'testResourceC',
      AppId: app.id,
      data: { foo: 'I reference Foo Two.', testResourceId: testResource2.id },
    });

    authorizeStudio();
    const responseGetTestResources = await request.get(
      `/api/apps/${app.id}/resources/testResource`,
    );
    expect(responseGetTestResources.data).toMatchObject([
      {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        foo: 'I am Foo.',
        id: 1,
      },
      {
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        foo: 'I am Foo Too.',
        id: 2,
      },
    ]);

    const responseGetTestResourcesC = await request.get(
      `/api/apps/${app.id}/resources/testResourceC`,
    );
    expect(responseGetTestResourcesC).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo.',
          id: 3,
          testResourceId: 1,
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo Two.',
          id: 4,
          testResourceId: 2,
        },
      ]),
    });

    authorizeStudio();

    const responseDeleteTestResources1 = await request.delete(
      `/api/apps/${app.id}/resources/testResource`,
      {
        data: [testResource1.id],
      },
    );
    expect(responseDeleteTestResources1).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetTestResourceCAfterDeletingTestResource1 = await request.get(
      `/api/apps/${app.id}/resources/testResourceC`,
    );
    expect(responseGetTestResourceCAfterDeletingTestResource1).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo Two.',
          id: 4,
          testResourceId: 2,
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo.',
          id: 3,
          testResourceId: null,
        },
      ]),
    });

    const responseDeleteTestResources2 = await request.delete(
      `/api/apps/${app.id}/resources/testResource`,
      {
        data: [testResource2.id],
      },
    );
    expect(responseDeleteTestResources2).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetTestResourceCAfterDeletingTestResource2 = await request.get(
      `/api/apps/${app.id}/resources/testResourceC`,
    );
    expect(responseGetTestResourceCAfterDeletingTestResource2).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo.',
          id: 3,
          testResourceId: null,
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo Two.',
          id: 4,
          testResourceId: null,
        },
      ]),
    });
  });

  it('should be able to delete multiple resources if they are referenced by another resource with cascading delete strategy', async () => {
    const testResource1 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo.' },
    });

    const testResource2 = await Resource.create({
      type: 'testResource',
      AppId: app.id,
      data: { foo: 'I am Foo Too.' },
    });

    await Resource.create({
      type: 'testResourceD',
      AppId: app.id,
      data: { foo: 'I reference Foo.', testResourceId: testResource1.id },
    });

    await Resource.create({
      type: 'testResourceD',
      AppId: app.id,
      data: { foo: 'I reference Foo Two.', testResourceId: testResource2.id },
    });

    authorizeStudio();
    const responseGetTestResources = await request.get(
      `/api/apps/${app.id}/resources/testResource`,
    );
    expect(responseGetTestResources).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo.",
          "id": 1,
        },
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I am Foo Too.",
          "id": 2,
        },
      ]
    `);

    const responseGetTestResourcesD = await request.get(
      `/api/apps/${app.id}/resources/testResourceD`,
    );
    expect(responseGetTestResourcesD).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo.',
          id: 3,
          testResourceId: 1,
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          foo: 'I reference Foo Two.',
          id: 4,
          testResourceId: 2,
        },
      ]),
    });

    authorizeStudio();
    const responseDeleteTest1 = await request.delete(`/api/apps/${app.id}/resources/testResource`, {
      data: [testResource1.id],
    });
    expect(responseDeleteTest1).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetTestResourceDAfterDeletingTestResource1 = await request.get(
      `/api/apps/${app.id}/resources/testResourceD`,
    );
    expect(responseGetTestResourceDAfterDeletingTestResource1).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "foo": "I reference Foo Two.",
          "id": 4,
          "testResourceId": 2,
        },
      ]
    `);

    const responseDeleteTest2 = await request.delete(`/api/apps/${app.id}/resources/testResource`, {
      data: [testResource2.id],
    });
    expect(responseDeleteTest2).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const responseGetTestResourceDAfterDeletingTestResource2 = await request.get(
      `/api/apps/${app.id}/resources/testResourceD`,
    );
    expect(responseGetTestResourceDAfterDeletingTestResource2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      []
    `);
  });
});
