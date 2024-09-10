import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeApp, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

useTestDatabase(import.meta);

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
        teams: {
          join: 'anyone',
          invite: [],
        },
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

  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });
});

describe('createAppTeamInvite', () => {
  beforeEach(() => {
    authorizeApp(app);
  });

  it('should not allow to invite team members if the join policy is not invite', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      role: '',
    });
    await TeamMember.create({ TeamId: team.id, AppMemberId: appMember.id, role: 'manager' });

    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/invites`, {
      email: 'newuser@example.com',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Team invites are not supported",
        "statusCode": 400,
      }
    `);
  });

  it('should not allow to create an invite for a non existent team', async () => {
    await app.update({
      definition: {
        ...app.definition,
        security: {
          ...app.definition.security,
          teams: {
            ...app.definition.security.teams,
            join: 'invite',
          },
        },
      },
    });
    const response = await request.post(`/api/apps/${app.id}/teams/83/invites`, {
      email: 'newuser@example.com',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Team 83 does not exist",
        "statusCode": 400,
      }
    `);
  });

  it('should allow only team managers to create a team invite if specified', async () => {
    await app.update({
      definition: {
        ...app.definition,
        security: {
          ...app.definition.security,
          teams: {
            ...app.definition.security.teams,
            join: 'invite',
            invite: ['$team:manager'],
          },
        },
      },
    });
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      role: '',
    });
    await TeamMember.create({ TeamId: team.id, AppMemberId: appMember.id, role: 'member' });
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/invites`, {
      email: 'newuser@example.com',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not allowed to invite members to this team",
        "statusCode": 403,
      }
    `);
  });

  it('should create and send an invite email', async () => {
    await app.update({
      definition: {
        ...app.definition,
        security: {
          ...app.definition.security,
          teams: {
            ...app.definition.security.teams,
            join: 'invite',
            invite: ['$team:member'],
          },
        },
      },
    });

    vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      role: '',
    });
    await TeamMember.create({ TeamId: team.id, AppMemberId: appMember.id, role: 'member' });
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/invites`, {
      email: 'newuser@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'teamInvite',
      to: {
        email: 'newuser@example.com',
      },
      values: {
        appName: 'Test App',
        link: expect.any(Function),
        name: 'null',
        teamName: 'A',
      },
    });
  });
});
