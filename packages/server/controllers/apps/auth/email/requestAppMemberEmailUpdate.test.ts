import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { createDefaultAppWithSecurity } from '../../../../utils/test/defaultAppSecurity.js';

let organization: Organization;
let user: User;

describe('requestAppMemberEmailUpdate', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
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

    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'appsemble',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should update an existing app member', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Admin',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
            Admin: {},
          },
        },
        users: {
          properties: {
            foo: {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const { AppMemberEmailAuthorization } = await getAppDB(app.id);
    const appMember = await createTestAppMember(app.id);

    authorizeAppMember(app, appMember);
    const response = await request.post(`/api/apps/${app.id}/auth/email/new-email`, {
      email: 'updated@example.com',
      password: 'testpassword',
    });
    expect(response.status).toBe(200);

    const emailAuth = await AppMemberEmailAuthorization.findOne();
    expect(emailAuth?.dataValues).toMatchObject({
      email: 'updated@example.com',
      key: expect.any(String),
      verified: false,
    });
  });

  // If the app member is created with login with appsemble.
  it('should throw if the app member does not have a password', async () => {
    const app = await createDefaultAppWithSecurity(organization);
    const { AppMember } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: 'old@example.com',
      emailVerified: true,
      role: PredefinedAppRole.Member,
      UserId: user.id,
    });

    authorizeAppMember(app, appMember);
    const response = await request.post(`/api/apps/${app.id}/auth/email/new-email`, {
      email: 'updated@example.com',
      password: 'testpassword123',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Can't change email for this app member.",
        "statusCode": 400,
      }
    `);
  });

  it('should not register invalid email addresses', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const member = await createTestAppMember(app.id);
    authorizeAppMember(app, member);
    const response = await request.post(`/api/apps/${app.id}/auth/email/new-email`, {
      email: 'foo',
      password: 'bar',
      timezone: 'Europe/Amsterdam',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "email",
            "instance": "foo",
            "message": "does not conform to the "email" format",
            "name": "format",
            "path": [
              "email",
            ],
            "property": "instance.email",
            "schema": {
              "format": "email",
              "type": "string",
            },
            "stack": "instance.email does not conform to the "email" format",
          },
        ],
        "message": "JSON schema validation failed",
      }
    `);
  });
});
