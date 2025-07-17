import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
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
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { exampleApp } from '../../../../utils/test/exampleApp.js';

let organization: Organization;
let user: User;
let app: App;
let originalSendNotification: typeof webpush.sendNotification;

describe('countAppResources', () => {
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

  it('should be able to count all resources of a type', async () => {
    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      type: 'testResource',
      data: { foo: 'baz' },
    });

    authorizeStudio();
    const responseA = await request.get(`/api/apps/${app.id}/resources/testResource/$count`);
    const responseB = await request.get(
      `/api/apps/${app.id}/resources/testExpirableResource/$count`,
    );

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      0
    `);
  });

  it('should apply filters', async () => {
    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await Resource.create({
      type: 'testResource',
      data: { foo: 'baz' },
    });
    await Resource.create({
      type: 'testResource',
      data: { foo: 'baz' },
    });

    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResource/$count?$filter=foo eq 'baz'`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should only count resources the user has access to', async () => {
    const { AppMember, Resource } = await getAppDB(app.id);
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });

    await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
    });
    await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'baz' },
    });

    authorizeAppMember(app, memberA);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/$count?$own=true`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      1
    `);
  });

  it('should only count resources from group members', async () => {
    const { AppMember, Group, GroupMember, Resource } = await getAppDB(app.id);
    const group = await Group.create({ name: 'Test Group' });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const userC = await User.create({ timezone: 'Europe/Amsterdam' });
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });
    const memberB = await AppMember.create({
      email: 'userB@example.com',
      userId: userB.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });
    const memberC = await AppMember.create({
      email: 'userC@example.com',
      userId: userC.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });

    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: memberA.id,
      role: 'ResourcesManager',
    });
    await GroupMember.create({
      GroupId: group.id,
      AppMemberId: memberB.id,
      role: 'Member',
    });

    await Resource.create({
      type: 'testResourceGroup',
      data: { foo: 'bar' },
      AuthorId: memberA.id,
      GroupId: group.id,
    });
    await Resource.create({
      type: 'testResourceGroup',
      data: { foo: 'baz' },
      AuthorId: memberB.id,
      GroupId: group.id,
    });
    await Resource.create({
      type: 'testResourceGroup',
      data: { foo: 'foo' },
      AuthorId: memberC.id,
    });

    authorizeAppMember(app, memberA);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceGroup/$count?selectedGroupId=${group.id}`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      2
    `);
  });

  it('should override general action roles', async () => {
    const { Resource } = await getAppDB(app.id);
    await Resource.create({
      type: 'testPrivateResource',
      data: { foo: 'bar' },
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/resources/testPrivateResource/$count`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      1
    `);
  });

  it('should throw if the user does not have enough permissions', async () => {
    const { AppMember, Resource } = await getAppDB(app.id);
    const memberA = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      role: PredefinedAppRole.Member,
      timezone: 'Europe/Amsterdam',
    });

    await Resource.create({
      type: 'testResourceAuthorOnly',
      data: { foo: 'bar' },
    });

    authorizeAppMember(app, memberA);
    const response = await request.get(
      `/api/apps/${app.id}/resources/testResourceAuthorOnly/$count`,
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
});
