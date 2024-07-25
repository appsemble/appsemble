import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMember,
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
  User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import {
  authorizeApp,
  authorizeStudio,
  createTestUser,
} from '../../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../../utils/test/testSchema.js';

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

describe('addAppTeamMember', () => {
  describe('app', () => {
    beforeEach(() => {
      authorizeApp(app);
    });

    it('should allow anyone to join if the join policy is `anyone', async () => {
      const team = await Team.create({ name: 'A', AppId: app.id });
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        name: user.name,
        role: 'Member',
      });

      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: user.id,
      });

      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "annotations": {},
          "id": 1,
          "name": "A",
          "role": "member",
        }
      `);
    });

    it('should allow reject users if the join policy is `invite`', async () => {
      const team = await Team.create({ name: 'A', AppId: app.id });
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Member',
      });

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
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: user.id,
      });

      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 403 Forbidden
        Content-Type: application/json; charset=utf-8

        {
          "error": "Forbidden",
          "message": "You need an invite to join this team",
          "statusCode": 403,
        }
      `);
    });
  });

  describe('studio', () => {
    beforeEach(() => {
      authorizeStudio();
    });

    it('should add an app member to a team', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });

      const member = await AppMember.create({
        AppId: app.id,
        UserId: userB.id,
        name: userB.name,
        email: userB.primaryEmail,
        role: 'Member',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: userB.id,
        role: 'Member',
      });
      const team = await Team.create({ name: 'A', AppId: app.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: userB.id,
          name: member.name,
          primaryEmail: member.email,
          role: TeamRole.Member,
        },
      });
    });

    it('should add an app member to a team by their email', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      const member = await AppMember.create({
        AppId: app.id,
        UserId: userB.id,
        name: userB.name,
        email: userB.primaryEmail,
        role: 'Member',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: userB.id,
        role: 'Member',
      });
      const team = await Team.create({ name: 'A', AppId: app.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.primaryEmail,
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: userB.id,
          name: member.name,
          primaryEmail: member.email,
          role: TeamRole.Member,
        },
      });
    });

    it('should add an app member to a team if team member has manager role', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      const member1 = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: '',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: userB.id,
        role: 'Member',
      });
      await OrganizationMember.update(
        { role: 'Member' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      const member2 = await AppMember.create({
        AppId: app.id,
        UserId: userB.id,
        name: userB.name,
        email: userB.primaryEmail,
        role: 'Member',
      });
      const team = await Team.create({ name: 'A', AppId: app.id });
      await TeamMember.create({ AppMemberId: member1.id, TeamId: team.id, role: TeamRole.Manager });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: userB.id,
          name: member2.name,
          primaryEmail: member2.email,
          role: TeamRole.Member,
        },
      });
    });

    it('should not add an app member if user has insufficient permissions', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: userB.id,
        role: 'Member',
      });
      await OrganizationMember.update(
        { role: 'Member' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      const team = await Team.create({ name: 'A', AppId: app.id });
      const appMember = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: '',
      });
      await TeamMember.create({
        AppMemberId: appMember.id,
        TeamId: team.id,
        role: TeamRole.Member,
      });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: user.id,
      });

      expect(response).toMatchObject({
        status: 403,
        data: { message: 'User does not have sufficient permissions.' },
      });
    });

    it('should not add an app member to a team twice', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      await AppMember.create({
        email: userB.primaryEmail,
        AppId: app.id,
        UserId: userB.id,
        role: 'Member',
      });
      const team = await Team.create({ name: 'A', AppId: app.id });
      await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, { id: userB.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 400,
        data: {
          message: 'This app member is already a member of this team.',
        },
      });
    });

    it("should not add a member who isn't part of the team's app members", async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      const app2 = await App.create({
        definition: {
          name: 'Test App 2',
          defaultPage: 'Test Page',
        },
        vapidPublicKey: 'c',
        vapidPrivateKey: 'd',
        OrganizationId: organization.id,
      });
      await AppMember.create({
        email: userB.primaryEmail,
        AppId: app2.id,
        UserId: userB.id,
        role: '',
      });
      const team = await Team.create({ name: 'A', AppId: app.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 404,
        data: {
          message: `App member with id ${userB.id} is not part of this app’s members.`,
        },
      });
    });
  });
});
