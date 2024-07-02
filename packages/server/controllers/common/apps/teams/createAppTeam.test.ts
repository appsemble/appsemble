import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMember,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeApp,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';
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

describe('createAppTeam', () => {
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
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'TeamCreator',
      });

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
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Invalid',
      });

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
      await OrganizationMember.update(
        { role: 'AppEditor' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      const response = await request.post(`/api/apps/${app.id}/teams`, {
        name: 'Test Team',
      });

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
      const response = await request.post(`/api/apps/${appB.id}/teams`, {
        name: 'Test Team',
      });

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
