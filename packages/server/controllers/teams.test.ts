import { createServer } from '@appsemble/node-utils';
import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';

import * as controllers from './index.js';
import {
  App,
  AppMember,
  Member,
  Organization,
  Team,
  TeamInvite,
  TeamMember,
  User,
} from '../models/index.js';
import { appRouter } from '../routes/appRouter/index.js';
import { argv, setArgv } from '../utils/argv.js';
import { authentication } from '../utils/authentication.js';
import { Mailer } from '../utils/email/Mailer.js';
import { authorizeApp, authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  server = await createServer({
    argv,
    appRouter,
    controllers,
    authentication: authentication(),
    context: { mailer: new Mailer(argv) },
  });
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

  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

describe('getTeams', () => {
  it('should return an empty array', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams`);

    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });

  it('should return a list of teams', async () => {
    const teamA = await Team.create({ name: 'A', AppId: app.id });
    const teamB = await Team.create({ name: 'B', AppId: app.id });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: teamA.id, name: teamA.name },
        { id: teamB.id, name: teamB.name },
      ],
    });
  });

  it('should include the role of the user', async () => {
    const teamA = await Team.create({ name: 'A', AppId: app.id });
    const teamB = await Team.create({ name: 'B', AppId: app.id });
    const teamC = await Team.create({ name: 'C', AppId: app.id });

    await TeamMember.bulkCreate([
      { role: TeamRole.Member, UserId: user.id, TeamId: teamA.id },
      { role: TeamRole.Manager, UserId: user.id, TeamId: teamB.id },
    ]);

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: teamA.id, name: teamA.name, role: TeamRole.Member },
        { id: teamB.id, name: teamB.name, role: TeamRole.Manager },
        { id: teamC.id, name: teamC.name },
      ],
    });
  });
});

describe('getTeam', () => {
  it('should return a team', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ role: TeamRole.Member, UserId: user.id, TeamId: team.id });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: { id: team.id, name: team.name, role: TeamRole.Member },
    });
  });

  it('should not return a team that doesn’t exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/80000`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });

  it('should not return a team for another app', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
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
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${appB.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });
});

describe('createTeam', () => {
  describe('app', () => {
    beforeEach(() => {
      authorizeApp(app);
    });

    it('should create a team if the user has the proper role', async () => {
      await app.update({
        definition: {
          ...app.definition,
          security: {
            ...app.definition.security,
            teams: { create: ['TeamCreator'] },
            roles: { TeamCreator: {} },
          },
        },
      });
      await AppMember.create({ AppId: app.id, UserId: user.id, role: 'TeamCreator' });

      const response = await request.post(`/api/apps/${app.id}/teams`, {
        name: 'Test Team',
      });
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "annotations": {},
          "id": 1,
          "name": "Test Team",
          "role": "manager",
        }
      `);
    });

    it('should reject if the user doesn’t have the proper role', async () => {
      await app.update({
        definition: {
          ...app.definition,
          security: {
            ...app.definition.security,
            teams: { create: ['TeamCreator'] },
            roles: { TeamCreator: {}, Invalid: {} },
          },
        },
      });
      await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Invalid' });

      const response = await request.post(`/api/apps/${app.id}/teams`, {
        name: 'Test Team',
      });
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 403 Forbidden
        Content-Type: application/json; charset=utf-8

        {
          "error": "Forbidden",
          "message": "User is not allowed to create teams",
          "statusCode": 403,
        }
      `);
    });

    it('should reject if the user is not an app member', async () => {
      await app.update({
        definition: {
          ...app.definition,
          security: {
            ...app.definition.security,
            teams: { create: ['TeamCreator'] },
            roles: { TeamCreator: {}, Invalid: {} },
          },
        },
      });

      const response = await request.post(`/api/apps/${app.id}/teams`, {
        name: 'Test Team',
      });
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 403 Forbidden
        Content-Type: application/json; charset=utf-8

        {
          "error": "Forbidden",
          "message": "User is not an app member",
          "statusCode": 403,
        }
      `);
    });
  });

  describe('studio', () => {
    beforeEach(() => {
      authorizeStudio();
    });

    it('should create a team if user is Owner', async () => {
      const response = await request.post(`/api/apps/${app.id}/teams`, {
        name: 'Test Team',
      });

      expect(response).toMatchObject({
        status: 201,
        data: { id: expect.any(Number), name: 'Test Team', role: TeamRole.Manager },
      });
    });

    it('should create a team with annotations', async () => {
      const response = await request.post(`/api/apps/${app.id}/teams`, {
        name: 'Test Team',
        annotations: { testKey: 'foo' },
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: expect.any(Number),
          name: 'Test Team',
          role: TeamRole.Manager,
          annotations: { testKey: 'foo' },
        },
      });
    });

    it('should not create a team if teams are not used or usable', async () => {
      const noSecurity = await App.create({
        definition: {
          name: 'No Security App',
          defaultPage: 'Test Page',
        },
        path: 'no-security-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      });

      const response = await request.post(`/api/apps/${noSecurity.id}/teams`, {
        name: 'Test Team',
      });

      expect(response).toMatchObject({
        status: 400,
        data: { message: 'App does not have a security definition.' },
      });
    });

    it('should not create a team if user is not an Owner', async () => {
      await Member.update(
        { role: 'AppEditor' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      const response = await request.post(`/api/apps/${app.id}/teams`, { name: 'Test Team' });

      expect(response).toMatchObject({
        status: 403,
        data: { message: 'User does not have sufficient permissions.' },
      });
    });

    it('should not create a team if user is not part of the organization', async () => {
      await Organization.create({
        id: 'appsemble',
        name: 'Appsemble',
      });
      const appB = await App.create({
        definition: {
          name: 'Test App 2',
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
        path: 'test-app-2',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: 'appsemble',
      });
      const response = await request.post(`/api/apps/${appB.id}/teams`, { name: 'Test Team' });

      expect(response).toMatchObject({
        status: 403,
        data: { message: 'User is not part of this organization.' },
      });
    });

    it('should not create a team for non-existent organizations', async () => {
      authorizeStudio();
      const response = await request.post('/api/apps/80123/teams', { name: 'Test Team' });

      expect(response).toMatchObject({
        status: 404,
        data: { message: 'App not found.' },
      });
    });
  });
});

describe('patchTeam', () => {
  it('should update the name of the team', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/${team.id}`, { name: 'B' });
    const responseB = await request.get<Team>(`/api/apps/${app.id}/teams/${team.id}`);

    expect(response).toMatchObject({ status: 200, data: { id: team.id, name: 'B' } });
    expect(responseB.data.name).toBe('B');
  });

  it('should update annotations', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/${team.id}`, {
      name: 'B',
      annotations: { testKey: 'foo' },
    });
    const responseB = await request.get(`/api/apps/${app.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 200,
      data: { id: team.id, name: 'B', annotations: { testKey: 'foo' } },
    });
    expect(responseB.data).toMatchObject({
      id: team.id,
      name: 'B',
      annotations: { testKey: 'foo' },
    });
  });

  it('should not update without sufficient permissions', async () => {
    await Member.update(
      { role: 'AppEditor' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/${team.id}`, { name: 'B' });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not update a non-existent team', async () => {
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}/teams/80000`, { name: 'B' });

    expect(response).toMatchObject({ status: 404, data: { message: 'Team not found.' } });
  });

  it('should not update a team from another organization', async () => {
    const org = await Organization.create({
      id: 'testorganization2',
      name: 'Test Organization',
    });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
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
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: org.id,
    });
    const team = await Team.create({ name: 'A', AppId: appB.id });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${appB.id}/teams/${team.id}`, { name: 'B' });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not part of this organization.' },
    });
  });
});

describe('deleteTeam', () => {
  it('should delete a team', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/teams/${team.id}`);
    const responseB = await request.get(`/api/apps/${app.id}/teams`);

    expect(response.status).toBe(204);
    expect(responseB.data).toStrictEqual([]);
  });

  it('should not delete without sufficient permissions', async () => {
    await Member.update(
      { role: 'AppEditor' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not delete teams from other organizations', async () => {
    const orgB = await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    const appB = await App.create({
      definition: {
        name: 'Test App 2',
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
      path: 'test-app-2',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: orgB.id,
    });
    const team = await Team.create({ name: 'A', AppId: appB.id });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${appB.id}/teams/${team.id}`);
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not part of this organization.' },
    });
  });
});

describe('getTeamMembers', () => {
  it('should return an empty array', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members`);

    expect(response).toMatchObject({ status: 200, data: [] });
  });

  it('should return a list of team members', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });

    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });
    await TeamMember.create({ TeamId: team.id, UserId: userB.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        { id: user.id, name: user.name, primaryEmail: user.primaryEmail, role: TeamRole.Manager },
        { id: userB.id, name: userB.name, primaryEmail: userB.primaryEmail, role: TeamRole.Member },
      ],
    });
  });

  it('should not fetch members of non-existent teams', async () => {
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/80000/members`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });
});

describe('getTeamMember', () => {
  it('should return specified member', async () => {
    const team = await Team.create({ name: 'Test team', AppId: app.id });
    await TeamMember.create({
      TeamId: team.id,
      UserId: user.id,
      role: TeamRole.Member,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members/${user.id}`);

    expect(response.data).toStrictEqual({
      id: user.id,
      name: user.name,
      primaryEmail: user.primaryEmail,
      role: TeamRole.Member,
    });
  });
});

describe('inviteTeamMember', () => {
  beforeEach(() => {
    authorizeApp(app);
  });

  it('should not allow to invite team members if the join policy is not invite', async () => {
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: 'manager' });

    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/invite`, {
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
    const response = await request.post(`/api/apps/${app.id}/teams/83/invite`, {
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
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: 'member' });
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/invite`, {
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

    import.meta.jest.spyOn(server.context.mailer, 'sendTemplateEmail');
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ TeamId: team.id, UserId: user.id, role: 'member' });
    const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/invite`, {
      email: 'newuser@example.com',
    });
    const invite = await TeamInvite.findOne();

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(server.context.mailer.sendTemplateEmail).toHaveBeenCalledWith(
      { email: 'newuser@example.com' },
      'teamInvite',
      {
        appName: 'Test App',
        teamName: 'A',
        url: `http://test-app.testorganization.localhost/Team-Invite?code=${invite.key}`,
      },
    );
  });
});

describe('addTeamMember', () => {
  describe('app', () => {
    beforeEach(() => {
      authorizeApp(app);
    });

    it('should allow anyone to join if the join policy is `anyone', async () => {
      const team = await Team.create({ name: 'A', AppId: app.id });
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
      await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
      await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
      const team = await Team.create({ name: 'A', AppId: app.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: userB.id,
          name: userB.name,
          primaryEmail: userB.primaryEmail,
          role: TeamRole.Member,
        },
      });
    });

    it('should add an app member to a team by their primary email', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
      await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
      const team = await Team.create({ name: 'A', AppId: app.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.primaryEmail,
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: userB.id,
          name: userB.name,
          primaryEmail: userB.primaryEmail,
          role: TeamRole.Member,
        },
      });
    });

    it('should add an app member to a team if user has manager role', async () => {
      const userB = await User.create({
        password: user.password,
        name: 'Test User',
        primaryEmail: 'testuser@example.com',
        timezone: 'Europe/Amsterdam',
      });
      await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
      await Member.update(
        { role: 'Member' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
      const team = await Team.create({ name: 'A', AppId: app.id });
      await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Manager });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: userB.id,
          name: userB.name,
          primaryEmail: userB.primaryEmail,
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
      await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
      await Member.update(
        { role: 'Member' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      const team = await Team.create({ name: 'A', AppId: app.id });
      await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Member });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
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
      await AppMember.create({ AppId: app.id, UserId: userB.id, role: 'Member' });
      const team = await Team.create({ name: 'A', AppId: app.id });
      await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, { id: userB.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 400,
        data: {
          message: 'This user is already a member of this team.',
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
      const team = await Team.create({ name: 'A', AppId: app.id });
      const response = await request.post(`/api/apps/${app.id}/teams/${team.id}/members`, {
        id: userB.id,
      });

      expect(response).toMatchObject({
        status: 404,
        data: {
          message: `User with id ${userB.id} is not part of this app’s members.`,
        },
      });
    });
  });
});

describe('removeTeamMember', () => {
  it('should remove a team member from a team', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );
    expect(response.status).toBe(204);
  });

  it('should remove a team member from a team by their primary email', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.primaryEmail}`,
    );
    expect(response.status).toBe(204);
  });

  it('should remove a team member from a team if the user has the manager role', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update({ role: 'Member' }, { where: { UserId: user.id, OrganizationId: app.id } });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });
    await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Manager });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );
    expect(response.status).toBe(204);
  });

  it('should not remove a team member from a team if the user has insufficient permissions', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );
    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient permissions.' },
    });
  });

  it('should not remove a member who isn’t part of the team', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });

    authorizeStudio();
    const response = await request.delete(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
    );

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'This user is not a member of this team.' },
    });
  });
});

describe('updateTeamMember', () => {
  it('should update the role of a team member', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Manager,
      },
    });
  });

  it('should update the role of a team member by their primary email', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(
      `/api/apps/${app.id}/teams/${team.id}/members/${userB.primaryEmail}`,
      {
        role: TeamRole.Manager,
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Manager,
      },
    });
  });

  it('should update the role of a team member if the user is a manager', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });
    await TeamMember.create({ UserId: user.id, TeamId: team.id, role: TeamRole.Manager });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: userB.name,
        primaryEmail: userB.primaryEmail,
        role: TeamRole.Manager,
      },
    });
  });

  it('should not update the role of a team member if the user has insufficient permissions', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    await Member.update(
      { role: 'Member' },
      { where: { UserId: user.id, OrganizationId: organization.id } },
    );
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ UserId: userB.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        message: 'User does not have sufficient permissions.',
      },
    });
  });

  it('should not update the role of a non-existent team member', async () => {
    const userB = await User.create({
      password: user.password,
      name: 'Test User',
      primaryEmail: 'testuser@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await Member.create({ OrganizationId: organization.id, UserId: userB.id, role: 'Member' });
    const team = await Team.create({ name: 'A', AppId: app.id });

    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/teams/${team.id}/members/${userB.id}`, {
      role: TeamRole.Manager,
    });

    expect(response).toMatchObject({
      status: 400,
      data: {
        message: 'This user is not a member of this team.',
      },
    });
  });
});

describe('acceptTeamInvite', () => {
  beforeEach(() => {
    authorizeApp(app);
  });

  it('should respond with 404 if no team invite was found', async () => {
    const response = await request.post(`/api/apps/${app.id}/team/invite`, { code: 'invalid' });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "No invite found for code: invalid",
        "statusCode": 404,
      }
    `);
  });

  it('should create a team member and destroy the invite', async () => {
    const team = await Team.create({ name: 'Fooz', AppId: app.id });
    const invite = await TeamInvite.create({
      TeamId: team.id,
      key: 'super secret',
      email: 'test@example.com',
    });
    const response = await request.post(`/api/apps/${app.id}/team/invite`, {
      code: 'super secret',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "annotations": {},
        "id": 1,
        "name": "Fooz",
        "role": "member",
      }
    `);
    await expect(invite.reload()).rejects.toBeDefined();
  });
});
