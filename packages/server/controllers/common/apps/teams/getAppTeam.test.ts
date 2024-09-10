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

describe('getAppTeam', () => {
  it('should return a team', async () => {
    const appMember = await AppMember.create({
      email: user.primaryEmail,
      UserId: user.id,
      timezone: 'Europe/Amsterdam',
      AppId: app.id,
      role: '',
    });
    const team = await Team.create({ name: 'A', AppId: app.id });
    await TeamMember.create({ role: TeamRole.Member, AppMemberId: appMember.id, TeamId: team.id });

    authorizeStudio();
    const response = await request.get(`/api/common/apps/${app.id}/teams/${team.id}`);
    expect(response).toMatchObject({
      status: 200,
      data: { id: team.id, name: team.name, role: TeamRole.Member },
    });
  });

  it('should not return a team that doesn’t exist', async () => {
    authorizeStudio();
    const response = await request.get(`/api/common/apps/${app.id}/teams/80000`);

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
    const response = await request.get(`/api/common/apps/${appB.id}/teams/${team.id}`);

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Team not found.' },
    });
  });
});
