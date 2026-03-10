import { randomUUID } from 'node:crypto';

import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  type Group,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeAppMember, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('addAppMemberToGroup', () => {
  let appMember: AppMember;
  let member: AppMember;
  let group: Group;

  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          groups: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Manager: {
              permissions: ['$group:member:create'],
            },
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    const { AppMember, Group, GroupMember } = await getAppDB(app.id);
    appMember = await AppMember.create({
      email: user.primaryEmail,
      userId: user.id,
      timezone: 'Europe/Amsterdam',
      role: PredefinedAppRole.Owner,
    });
    group = await Group.create({
      name: 'testGroup',
      demo: false,
    });

    authorizeAppMember(app, appMember);
    await GroupMember.create({
      role: 'Manager',
      GroupId: group.id,
      AppMemberId: appMember.id,
    });
    member = await AppMember.create({
      email: 'test2@example.com',
      role: PredefinedAppRole.Member,
    });
  });

  it('should throw if the app is not found', async () => {
    const response = await request.post(`/api/apps/${app.id + 5}/groups/${group.id}/members`, {
      role: 'Reader',
      id: member.id,
    });
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

  it('should throw if the app does not have a security definition', async () => {
    await app.update({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
    });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/members`, {
      role: 'Reader',
      id: member.id,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App does not have a security definition.",
        "statusCode": 403,
      }
    `);
  });

  it('should throw if the group does not exist', async () => {
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id + 5}/members`, {
      role: 'Reader',
      id: member.id,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Group not found",
        "statusCode": 404,
      }
    `);
  });

  it('should throw if the app member does not exist', async () => {
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/members`, {
      role: 'Reader',
      id: randomUUID(),
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App member does not exist",
        "statusCode": 404,
      }
    `);
  });

  it('should throw if the app member is already in the specified group', async () => {
    const { GroupMember } = await getAppDB(app.id);
    await GroupMember.create({ role: 'Reader', AppMemberId: member.id, GroupId: group.id });
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/members`, {
      role: 'Reader',
      id: member.id,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "Group Member already exists",
        "statusCode": 409,
      }
    `);
  });

  it('should throw if the authenticated member does not have enough permissions', async () => {
    const { GroupMember } = await getAppDB(app.id);
    await GroupMember.update(
      { role: 'Reader' },
      { where: { AppMemberId: appMember.id, GroupId: group.id } },
    );
    const response = await request.post(`/api/apps/${app.id}/groups/${group.id}/members`, {
      role: 'Reader',
      id: member.id,
    });
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

  it('should create a new group member', async () => {
    const { data, status } = await request.post(`/api/apps/${app.id}/groups/${group.id}/members`, {
      role: 'Reader',
      id: member.id,
    });
    expect(status).toBe(200);
    expect(data).toMatchObject({
      role: 'Reader',
      AppMemberId: member.id,
      GroupId: group.id,
    });
  });
});
