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

describe('updateAppTeamMember', () => {
  it('should update the role of a team member', async () => {
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
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appMember = await AppMember.create({
      UserId: userB.id,
      AppId: app.id,
      name: userB.name,
      email: userB.primaryEmail,
      role: '',
    });
    await TeamMember.create({ AppMemberId: appMember.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(
      `/api/common/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
      {
        role: TeamRole.Manager,
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: appMember.name,
        primaryEmail: appMember.email,
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: 'Member',
    });
    const team = await Team.create({ name: 'A', AppId: app.id });
    const appMember = await AppMember.create({
      UserId: userB.id,
      AppId: app.id,
      name: userB.name,
      email: userB.primaryEmail,
      role: '',
    });
    await TeamMember.create({ AppMemberId: appMember.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(
      `/api/common/apps/${app.id}/teams/${team.id}/members/${appMember.email}`,
      {
        role: TeamRole.Manager,
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: appMember.name,
        primaryEmail: appMember.email,
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
    const appMember1 = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: '',
    });
    const appMember2 = await AppMember.create({
      AppId: app.id,
      UserId: userB.id,
      name: userB.name,
      email: userB.primaryEmail,
      role: '',
    });
    await TeamMember.create({ AppMemberId: appMember2.id, TeamId: team.id, role: TeamRole.Member });
    await TeamMember.create({
      AppMemberId: appMember1.id,
      TeamId: team.id,
      role: TeamRole.Manager,
    });

    authorizeStudio();
    const response = await request.put(
      `/api/common/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
      {
        role: TeamRole.Manager,
      },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: appMember2.name,
        primaryEmail: appMember2.email,
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
      email: userB.primaryEmail,
      AppId: app.id,
      UserId: userB.id,
      timezone: 'Europe/Amsterdam',
      role: '',
    });
    await TeamMember.create({ AppMemberId: appMember.id, TeamId: team.id, role: TeamRole.Member });

    authorizeStudio();
    const response = await request.put(
      `/api/common/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
      {
        role: TeamRole.Manager,
      },
    );

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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: userB.id,
      role: 'Member',
    });
    const team = await Team.create({ name: 'A', AppId: app.id });

    authorizeStudio();
    const response = await request.put(
      `/api/common/apps/${app.id}/teams/${team.id}/members/${userB.id}`,
      {
        role: TeamRole.Manager,
      },
    );

    expect(response).toMatchObject({
      status: 400,
      data: {
        message: 'This user is not a member of this team.',
      },
    });
  });
});
