import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let user: User;
let app: App;

describe('deleteDemoAppMembers', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    app = await App.create({
      definition: {
        name: 'Test App',
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
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      demoMode: true,
      OrganizationId: organization.id,
    });
    const { AppMember } = await getAppDB(app.id);
    await AppMember.bulkCreate(
      Array.from(Array.from({ length: 5 }).keys()).map((entry) => ({
        email: `test${entry}@example.com`,
        name: `Test ${entry}`,
        demo: true,
        role: 'Reader',
        seed: true,
      })),
    );
  });

  it('should throw if app is not found', async () => {
    await authorizeClientCredentials('apps:write');
    const response = await request.delete('/api/apps/55/demo-members');
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should throw if the app is not in demo mode', async () => {
    authorizeClientCredentials('apps:write');
    await app.update({ demoMode: false });
    const response = await request.delete(`/api/apps/${app.id}/demo-members`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App should be in demo mode",
        "statusCode": 403,
      }
    `);
  });

  it('should not delete app members from other apps', async () => {
    await authorizeClientCredentials('apps:write');
    const app2 = await App.create({
      definition: Object.assign(app.definition, {
        security: {
          default: {
            role: 'Staff',
            policy: 'everyone',
          },
          roles: {
            Staff: {},
            Manager: {},
          },
        },
      }),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      demoMode: true,
      path: 'test-app-dup',
    });
    const { AppMember } = await getAppDB(app.id);
    const { AppMember: AppMember2 } = await getAppDB(app2.id);
    const memberApp2 = await AppMember2.create({
      email: 'test@example.com',
      name: 'Test',
      demo: true,
      role: 'Staff',
      seed: true,
      ephemeral: false,
    });
    const { status } = await request.delete(`/api/apps/${app.id}/demo-members`);
    expect(status).toBe(204);
    const members = await AppMember.findAll();
    expect(members).toStrictEqual([]);
    const member2 = await AppMember2.findOne();
    expect(member2?.dataValues).toMatchObject(memberApp2.dataValues);
  });

  it('should delete seeded app members from the app', async () => {
    await authorizeClientCredentials('apps:write');
    const { status } = await request.delete(`/api/apps/${app.id}/demo-members`);
    expect(status).toBe(204);
    const { AppMember } = await getAppDB(app.id);
    const members = await AppMember.findAll();
    expect(members).toStrictEqual([]);
  });
});
