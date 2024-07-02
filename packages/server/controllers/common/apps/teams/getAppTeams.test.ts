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
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
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

describe('getAppTeams', () => {
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
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      role: '',
    });
    const teamA = await Team.create({ name: 'A', AppId: app.id });
    const teamB = await Team.create({ name: 'B', AppId: app.id });
    const teamC = await Team.create({ name: 'C', AppId: app.id });

    await TeamMember.bulkCreate([
      { role: TeamRole.Member, AppMemberId: appMember.id, TeamId: teamA.id },
      { role: TeamRole.Manager, AppMemberId: appMember.id, TeamId: teamB.id },
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
