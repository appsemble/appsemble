import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  Organization,
  OrganizationMember,
  Team,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

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
    await OrganizationMember.update(
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
