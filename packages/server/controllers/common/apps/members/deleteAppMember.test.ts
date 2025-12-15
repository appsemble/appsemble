import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  getAppDB,
  Organization,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeAppMember,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let member: OrganizationMember;
let user: User;

describe('deleteAppMember', () => {
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
    member = await OrganizationMember.create({
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

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();
    const response = await request.delete(
      '/api/apps/1/app-members/e1f0eda6-b2cd-4e66-ae8d-f9dee33d1624',
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found.",
        "statusCode": 404,
      }
    `);
  });

  it('should throw 404 if the app member doesn’t exist', async () => {
    authorizeStudio();
    const app = await App.create({
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.delete(
      `/api/apps/${app.id}/app-members/e1f0eda6-b2cd-4e66-ae8d-f9dee33d1624`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App member not found",
        "statusCode": 404,
      }
    `);
  });

  it('should verify the app role if the user id and member id don’t match', async () => {
    authorizeStudio();
    const app = await App.create({
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await member.update({ role: PredefinedOrganizationRole.Member });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    const appMemberB = await AppMember.create({
      email: 'userB@example.com',
      userId: userB.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMemberB.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient app permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should allow app owners to delete an app member', async () => {
    authorizeStudio();
    const app = await App.create({
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: 'user@example.com',
      userId: userB.id,
      role: 'Reader',
      timezone: 'Europe/Amsterdam',
    });
    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    await expect(() => appMember.reload()).rejects.toThrowError(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not allow app user to delete their account using this endpoint', async () => {
    const app = await App.create({
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const userB = await User.create({
      timezone: 'Europe/Amsterdam',
      primaryEmail: 'userB@example.com',
    });
    const { AppMember } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: 'userB@example.com',
      userId: userB.id,
      role: 'Reader',
    });
    authorizeAppMember(app, appMember);
    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Cannot use this endpoint to delete your own account",
        "statusCode": 401,
      }
    `);
    expect(appMember).not.toBeNull();
  });

  it('should cascade correctly', async () => {
    authorizeStudio();
    const app = await App.create({
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const {
      AppMember,
      AppOAuth2Authorization,
      AppOAuth2Secret,
      AppSamlAuthorization,
      AppSamlSecret,
    } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      email: 'userB@example.com',
      userId: userB.id,
      role: 'Reader',
    });
    const samlSecret = await AppSamlSecret.create({
      entityId: '',
      ssoUrl: '',
      name: '',
      icon: '',
      idpCertificate: '',
      spPrivateKey: '',
      spPublicKey: '',
      spCertificate: '',
    });
    const oauth2Secret = await AppOAuth2Secret.create({
      authorizationUrl: '',
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      icon: '',
      name: '',
      scope: '',
    });
    const samlAuthorization = await AppSamlAuthorization.create({
      AppSamlSecretId: samlSecret.id,
      AppMemberId: appMember.id,
      nameId: 'foo',
      email: appMember.email,
    });
    const oauth2Authorization = await AppOAuth2Authorization.create({
      AppOAuth2SecretId: oauth2Secret.id,
      AppMemberId: appMember.id,
      email: appMember.email,
      accessToken: 'foo.bar.baz',
      sub: '42',
      refreshToken: 'refresh',
      expiresAt: new Date(),
    });
    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}`);

    expect(response).toMatchObject({
      status: 204,
      data: '',
    });
    await expect(() => appMember.reload()).rejects.toThrowError(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    await expect(() => samlAuthorization.reload()).rejects.toThrowError(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    await expect(() => oauth2Authorization.reload()).rejects.toThrowError(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    await samlSecret.reload();
    await oauth2Secret.reload();
  });
});
