import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMember,
  GroupMember,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let app: App;
let user: User;
let server: Koa;

describe('createGroup', () => {
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
          groups: {
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
      role: PredefinedOrganizationRole.Owner,
    });
  });

  describe('app', () => {
    it('should create a group if the user has the proper role', async () => {
      await app.update({
        definition: {
          ...app.definition,
          security: {
            ...app.definition.security,
            roles: {
              GroupCreator: {
                permissions: ['$group:create'],
                inherits: [],
              },
            },
          },
        },
      });
      const appMember = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'GroupCreator',
      });
      authorizeAppMember(app, appMember);

      const response = await request.post(`/api/apps/${app.id}/groups`, {
        name: 'Test Group',
      });
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "annotations": {},
          "id": 1,
          "name": "Test Group",
        }
      `);
    });

    it('should reject if the user doesn’t have the proper role', async () => {
      await app.update({
        definition: {
          ...app.definition,
          security: {
            ...app.definition.security,
            groups: { create: ['GroupCreator'] },
            roles: { GroupCreator: {}, Invalid: {} },
          },
        },
      });
      const appMember = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Invalid',
      });
      authorizeAppMember(app, appMember);

      const response = await request.post(`/api/apps/${app.id}/groups`, {
        name: 'Test Group',
      });
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 403 Forbidden
        Content-Type: application/json; charset=utf-8

        {
          "error": "Forbidden",
          "message": "App member does not have sufficient app permissions.",
          "statusCode": 403,
        }
      `);
    });

    it('should add all app members to newly created group for a demo app', async () => {
      await app.update({
        demoMode: true,
        definition: {
          ...app.definition,
          security: {
            ...app.definition.security,
            roles: {
              GroupCreator: {
                permissions: ['$group:create'],
                inherits: [],
              },
            },
          },
        },
      });
      const appMember = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'GroupCreator',
      });
      await AppMember.bulkCreate(
        [...Array.from({ length: 5 }).keys()].map((key) => ({
          email: `test${key}@example.com`,
          AppId: app.id,
          role: PredefinedAppRole.Member,
          demo: true,
        })),
      );
      authorizeAppMember(app, appMember);

      const response = await request.post(`/api/apps/${app.id}/groups`, {
        name: 'Test Group',
      });
      expect(response).toMatchInlineSnapshot(`
        HTTP/1.1 201 Created
        Content-Type: application/json; charset=utf-8

        {
          "annotations": {},
          "id": 1,
          "name": "Test Group",
        }
      `);
      const foundMembers = await GroupMember.findAll({ where: { GroupId: 1 } });
      expect(foundMembers).toMatchObject([
        {
          GroupId: 1,
          role: PredefinedAppRole.Member,
        },
        {
          GroupId: 1,
          role: PredefinedAppRole.Member,
        },
        {
          GroupId: 1,
          role: PredefinedAppRole.Member,
        },
        {
          GroupId: 1,
          role: PredefinedAppRole.Member,
        },
        {
          GroupId: 1,
          role: PredefinedAppRole.Member,
        },
      ]);
    });
  });

  describe('studio', () => {
    beforeEach(() => {
      authorizeStudio();
    });

    it('should create a group if user is Owner', async () => {
      const response = await request.post(`/api/apps/${app.id}/groups`, {
        name: 'Test Group',
      });

      expect(response).toMatchObject({
        status: 201,
        data: { id: expect.any(Number), name: 'Test Group' },
      });
    });

    it('should create a group with annotations', async () => {
      const response = await request.post(`/api/apps/${app.id}/groups`, {
        name: 'Test Group',
        annotations: { testKey: 'foo' },
      });

      expect(response).toMatchObject({
        status: 201,
        data: {
          id: expect.any(Number),
          name: 'Test Group',
          annotations: { testKey: 'foo' },
        },
      });
    });

    it('should not create a group if groups are not used or usable', async () => {
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
      authorizeStudio();

      const response = await request.post(`/api/apps/${noSecurity.id}/groups`, {
        name: 'Test Group',
      });

      expect(response).toMatchObject({
        status: 400,
        data: { message: 'App does not have a security definition' },
      });
    });

    it('should not create a group if user is not an Owner', async () => {
      await OrganizationMember.update(
        { role: 'Member' },
        { where: { UserId: user.id, OrganizationId: organization.id } },
      );
      const response = await request.post(`/api/apps/${app.id}/groups`, {
        name: 'Test Group',
      });

      expect(response).toMatchObject({
        status: 403,
        data: { message: 'User does not have sufficient app permissions.' },
      });
    });

    it('should not create a group if user is not part of the organization', async () => {
      await Organization.create({
        id: 'appsemble',
        name: 'Appsemble',
      });
      const appB = await App.create({
        definition: {
          name: 'Test App 2',
          defaultPage: 'Test Page',
          security: {
            groups: {
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
      const response = await request.post(`/api/apps/${appB.id}/groups`, {
        name: 'Test Group',
      });

      expect(response).toMatchObject({
        status: 403,
        data: { message: 'User does not have sufficient app permissions.' },
      });
    });

    it('should not create a group for non-existent organizations', async () => {
      authorizeStudio();
      const response = await request.post('/api/apps/80123/groups', { name: 'Test Group' });

      expect(response).toMatchObject({
        status: 404,
        data: { message: 'App not found' },
      });
    });
  });
});
