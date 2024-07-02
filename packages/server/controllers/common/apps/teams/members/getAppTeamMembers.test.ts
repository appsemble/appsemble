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
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';
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

describe('getAppTeamMembers', () => {
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: 'Member',
    });

    const appMember = await AppMember.create({
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      AppId: app.id,
      role: '',
    });
    const appMemberB = await AppMember.create({
      UserId: userB.id,
      name: userB.name,
      email: userB.primaryEmail,
      AppId: app.id,
      timezone: 'Europe/Amsterdam',
      role: '',
    });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({
      TeamId: team.id,
      AppMemberId: appMember.id,
      role: TeamRole.Manager,
    });
    await TeamMember.create({
      TeamId: team.id,
      AppMemberId: appMemberB.id,
      role: TeamRole.Member,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members`);

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: appMember.id,
          name: appMember.name,
          primaryEmail: appMember.email,
          role: TeamRole.Manager,
        },
        {
          id: appMemberB.id,
          name: appMemberB.name,
          primaryEmail: appMemberB.email,
          role: TeamRole.Member,
        },
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
