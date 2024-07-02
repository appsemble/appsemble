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

describe('getAppTeamMember', () => {
  it('should return specified member', async () => {
    const team = await Team.create({ name: 'Test team', AppId: app.id });
    const member = await AppMember.create({
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      AppId: app.id,
      role: '',
    });
    await TeamMember.create({
      TeamId: team.id,
      AppMemberId: member.id,
      role: TeamRole.Member,
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/teams/${team.id}/members/${user.id}`);

    expect(response.data).toStrictEqual({
      id: user.id,
      name: member.name,
      primaryEmail: member.email,
      role: TeamRole.Member,
    });
  });
});
