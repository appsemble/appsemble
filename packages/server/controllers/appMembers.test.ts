import { createFixtureStream, createFormData, readFixture } from '@appsemble/node-utils';
import { type AppAccount, type AppMember as AppMemberType } from '@appsemble/types';
import { jwtPattern, uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppSamlAuthorization,
  AppSamlSecret,
  BlockVersion,
  Organization,
  OrganizationMember,
  Resource,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeApp, authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let organization: Organization;
let member: OrganizationMember;
let user: User;

function createDefaultApp(org: Organization): Promise<App> {
  return App.create({
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
    OrganizationId: org.id,
  });
}

useTestDatabase(import.meta);

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
    role: 'Owner',
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

describe('getAppMembers', () => {
  it('should fetch app members', async () => {
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

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Test Member',
      email: 'member@example.com',
      role: 'Admin',
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            userId: expect.stringMatching(uuid4Pattern),
            memberId: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "demo": false,
          "memberId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "name": "Test Member",
          "primaryEmail": "member@example.com",
          "properties": {},
          "role": "Admin",
          "userId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        },
      ]
    `,
    );
  });

  it('should include organization members with the default role if policy is not invite', async () => {
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

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchInlineSnapshot(
      {
        data: [
          {
            userId: expect.stringMatching(uuid4Pattern),
          },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "demo": false,
          "name": "Test User",
          "primaryEmail": "test@example.com",
          "role": "Reader",
          "userId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        },
      ]
    `,
    );
  });

  it('should only return invited members if policy is set to invite', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          default: {
            role: 'Reader',
            policy: 'invite',
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

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/members`);
    expect(response).toMatchObject({
      status: 200,
      data: [],
    });
  });
});

describe('getAppMember', () => {
  it('should return 404 if no app was found', async () => {
    authorizeStudio();
    const response = await request.get(
      '/api/apps/123/members/67ab4ea6-ce98-4f08-b599-d8fc4b460d37',
    );
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

  it('should return 404 if the app doesn’t have a security definition', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/members/67ab4ea6-ce98-4f08-b599-d8fc4b460d37`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App does not have a security definition",
        "statusCode": 404,
      }
    `);
  });

  it('should return 404 if no app member was found', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: { definition: {} },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    authorizeStudio();
    const response = await request.get(
      `/api/apps/${app.id}/members/67ab4ea6-ce98-4f08-b599-d8fc4b460d37`,
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

  it('should return an app member if it is found', async () => {
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
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      name: 'Foo',
      email: 'foo@example.com',
      role: 'Reader',
    });
    authorizeStudio();
    const response = await request.get<AppMemberType>(`/api/apps/${app.id}/members/${user.id}`);
    expect(response).toMatchInlineSnapshot(
      {
        data: {
          userId: expect.stringMatching(uuid4Pattern),
          memberId: expect.stringMatching(uuid4Pattern),
        },
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "demo": false,
        "memberId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Foo",
        "primaryEmail": "foo@example.com",
        "properties": {},
        "role": "Reader",
        "userId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
      }
    `,
    );
    expect(response.data.userId).toBe(user.id);
  });
});

describe('setAppMember', () => {
  it('should add app members', async () => {
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
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/members/${userB.id}`, {
      role: 'Admin',
      properties: { test: 'Property' },
    });
    expect(response).toMatchInlineSnapshot(
      {
        data: {
          memberId: expect.stringMatching(uuid4Pattern),
          userId: expect.stringMatching(uuid4Pattern),
        },
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "memberId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": null,
        "primaryEmail": null,
        "properties": {
          "test": "Property",
        },
        "role": "Admin",
        "userId": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
      }
    `,
    );
    expect(response.data.userId).toBe(userB.id);
  });
});

describe('deleteAppMember', () => {
  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();
    const response = await request.delete(
      '/api/apps/253/members/e1f0eda6-b2cd-4e66-ae8d-f9dee33d1624',
    );

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
      `/api/apps/${app.id}/members/e1f0eda6-b2cd-4e66-ae8d-f9dee33d1624`,
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
    await member.update({ role: 'Member' });
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Reader' });
    const response = await request.delete(`/api/apps/${app.id}/members/${userB.id}`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
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
    const appMember = await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Reader' });
    const response = await request.delete(`/api/apps/${app.id}/members/${userB.id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    await expect(() => appMember.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should allow app users to delete their own account', async () => {
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
    const appMember = await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Reader' });
    authorizeStudio(userB);
    const response = await request.delete(`/api/apps/${app.id}/members/${userB.id}`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    await expect(() => appMember.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
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
    const appMember = await AppMember.create({ UserId: userB.id, AppId: app.id, role: 'Reader' });
    const samlSecret = await AppSamlSecret.create({
      AppId: app.id,
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
      AppId: app.id,
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
    });
    const oauth2Authorization = await AppOAuth2Authorization.create({
      AppOAuth2SecretId: oauth2Secret.id,
      AppMemberId: appMember.id,
      accessToken: 'foo.bar.baz',
      sub: '42',
      refreshToken: 'refresh',
      expiresAt: new Date(),
    });
    const response = await request.delete(`/api/apps/${app.id}/members/${userB.id}`);

    expect(response).toMatchObject({
      status: 204,
      data: '',
    });
    await expect(() => appMember.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    await expect(() => samlAuthorization.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    await expect(() => oauth2Authorization.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    await samlSecret.reload();
    await oauth2Secret.reload();
  });
});

describe('getAppAccounts', () => {
  it('should return all of the user’s app accounts', async () => {
    authorizeStudio();

    const appA = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appB = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await AppMember.create({ AppId: appA.id, UserId: user.id, role: 'Admin' });
    await AppMember.create({ AppId: appB.id, UserId: user.id, role: 'Member' });

    const response = await request.get('/api/user/apps/accounts');

    expect(response).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "app": {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "OrganizationId": "testorganization",
            "OrganizationName": "Test Organization",
            "controllerCode": null,
            "controllerImplementations": null,
            "definition": {},
            "demoMode": false,
            "domain": null,
            "emailName": null,
            "enableSelfRegistration": true,
            "googleAnalyticsID": null,
            "hasIcon": false,
            "hasMaskableIcon": false,
            "iconBackground": "#ffffff",
            "iconUrl": null,
            "id": 1,
            "locked": "unlocked",
            "longDescription": null,
            "path": null,
            "seed": false,
            "sentryDsn": null,
            "sentryEnvironment": null,
            "showAppDefinition": false,
            "showAppsembleLogin": false,
            "showAppsembleOAuth2Login": true,
            "visibility": "unlisted",
            "yaml": "{}
      ",
          },
          "email": null,
          "emailVerified": false,
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "name": null,
          "properties": {},
          "role": "Admin",
          "sso": [],
        },
        {
          "app": {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "OrganizationId": "testorganization",
            "OrganizationName": "Test Organization",
            "controllerCode": null,
            "controllerImplementations": null,
            "definition": {},
            "demoMode": false,
            "domain": null,
            "emailName": null,
            "enableSelfRegistration": true,
            "googleAnalyticsID": null,
            "hasIcon": false,
            "hasMaskableIcon": false,
            "iconBackground": "#ffffff",
            "iconUrl": null,
            "id": 2,
            "locked": "unlocked",
            "longDescription": null,
            "path": null,
            "seed": false,
            "sentryDsn": null,
            "sentryEnvironment": null,
            "showAppDefinition": false,
            "showAppsembleLogin": false,
            "showAppsembleOAuth2Login": true,
            "visibility": "unlisted",
            "yaml": "{}
      ",
          },
          "email": null,
          "emailVerified": false,
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "name": null,
          "properties": {},
          "role": "Member",
          "sso": [],
        },
      ]
    `,
    );
  });
});

describe('getAppAccount', () => {
  it('should return the user’s app account', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'Member',
      properties: { test: 'Property' },
    });

    const response = await request.get(`/api/user/apps/${app.id}/account`);

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "app": {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {},
          "demoMode": false,
          "domain": null,
          "emailName": null,
          "enableSelfRegistration": true,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
          "longDescription": null,
          "path": null,
          "seed": false,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "unlisted",
          "yaml": "{}
      ",
        },
        "email": null,
        "emailVerified": false,
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": null,
        "properties": {
          "test": "Property",
        },
        "role": "Member",
        "sso": [],
      }
    `,
    );
  });

  it('should throw 404 if the app account doesn’t exist', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });

    const response = await request.get(`/api/user/apps/${app.id}/account`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App account not found",
        "statusCode": 404,
      }
    `);
  });

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();

    const response = await request.get('/api/user/apps/404/account');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App account not found",
        "statusCode": 404,
      }
    `);
  });
});

describe('patchAppAccount', () => {
  it('should update and return the user’s app account', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appMember = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const response = await request.patch(
      `/api/user/apps/${app.id}/account`,
      createFormData({ email: 'user@example.com', name: 'Me', properties: { test: 'Property' } }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "app": {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {},
          "demoMode": false,
          "domain": null,
          "emailName": null,
          "enableSelfRegistration": true,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
          "longDescription": null,
          "path": null,
          "seed": false,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "unlisted",
          "yaml": "{}
      ",
        },
        "email": "user@example.com",
        "emailVerified": false,
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Me",
        "picture": "https://www.gravatar.com/avatar/b58996c504c5638798eb6b511e6f49af?s=128&d=mp",
        "properties": {
          "test": "Property",
        },
        "role": "Member",
        "sso": [],
      }
    `,
    );
    await appMember.reload();
    expect(appMember.name).toBe('Me');
    expect(appMember.email).toBe('user@example.com');
  });

  it('should allow for updating the profile picture', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const appMember = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'Member' });

    const response = await request.patch<AppAccount>(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'user@example.com',
        name: 'Me',
        picture: createFixtureStream('tux.png'),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.stringMatching(uuid4Pattern), picture: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "app": {
          "$created": "1970-01-01T00:00:00.000Z",
          "$updated": "1970-01-01T00:00:00.000Z",
          "OrganizationId": "testorganization",
          "OrganizationName": "Test Organization",
          "controllerCode": null,
          "controllerImplementations": null,
          "definition": {},
          "demoMode": false,
          "domain": null,
          "emailName": null,
          "enableSelfRegistration": true,
          "googleAnalyticsID": null,
          "hasIcon": false,
          "hasMaskableIcon": false,
          "iconBackground": "#ffffff",
          "iconUrl": null,
          "id": 1,
          "locked": "unlocked",
          "longDescription": null,
          "path": null,
          "seed": false,
          "sentryDsn": null,
          "sentryEnvironment": null,
          "showAppDefinition": false,
          "showAppsembleLogin": false,
          "showAppsembleOAuth2Login": true,
          "visibility": "unlisted",
          "yaml": "{}
      ",
        },
        "email": "user@example.com",
        "emailVerified": false,
        "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
        "name": "Me",
        "picture": Any<String>,
        "properties": {},
        "role": "Member",
        "sso": [],
      }
    `,
    );
    expect(response.data.picture).toBe(
      `http://localhost/api/apps/1/members/${user.id}/picture?updated=0`,
    );
    await appMember.reload();
    expect(appMember.picture).toStrictEqual(await readFixture('tux.png'));
  });

  it('should throw 404 if the app account doesn’t exist', async () => {
    authorizeStudio();

    const app = await App.create({
      OrganizationId: 'testorganization',
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });

    const response = await request.patch(
      `/api/user/apps/${app.id}/account`,
      createFormData({ email: 'user@example.com', name: '' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App account not found",
        "statusCode": 404,
      }
    `);
  });

  it('should throw 404 if the app doesn’t exist', async () => {
    authorizeStudio();

    const response = await request.patch(
      '/api/user/apps/404/account',
      createFormData({ email: 'user@example.com', name: '' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App account not found",
        "statusCode": 404,
      }
    `);
  });
});

describe('createMemberEmail', () => {
  it('should create valid email addresses', async () => {
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
            lastCompletedTask: {
              schema: {
                type: 'integer',
              },
            },
            completedTasks: {
              schema: {
                type: 'array',
              },
              reference: {
                resource: 'tasks',
              },
            },
          },
        },
        resources: {
          tasks: {
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                },
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
    authorizeApp(app);

    const task = await Resource.create({
      AppId: app.id,
      type: 'tasks',
      data: {},
    });

    const response = await request.post(
      `/api/user/apps/${app.id}/accounts`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
        properties: JSON.stringify({
          lastCompletedTask: String(task.id),
          completedTasks: JSON.stringify([task.id]),
        }),
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(m.password).not.toBe('password');
    expect(await compare('password', m.password)).toBe(true);
  });

  it('should accept a display name', async () => {
    const app = await createDefaultApp(organization);
    authorizeApp(app);

    const response = await request.post(
      `/api/user/apps/${app.id}/accounts`,
      createFormData({
        email: 'test@example.com',
        name: 'Me',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });
    expect(m.name).toBe('Me');
  });

  it('should not register invalid email addresses', async () => {
    const app = await createDefaultApp(organization);
    authorizeApp(app);

    const response = await request.post(
      `/api/user/apps/${app.id}/accounts`,
      createFormData({ email: 'foo', password: 'bar', timezone: 'Europe/Amsterdam' }),
    );

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
          {
            "argument": 8,
            "instance": "bar",
            "message": "does not meet minimum length of 8",
            "name": "minLength",
            "path": [
              "password",
            ],
            "property": "instance.password",
            "schema": {
              "minLength": 8,
              "type": "string",
            },
            "stack": "instance.password does not meet minimum length of 8",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not register duplicate email addresses', async () => {
    const app = await createDefaultApp(organization);
    authorizeApp(app);

    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'User',
      email: 'test@example.com',
    });

    const response = await request.post(
      `/api/user/apps/${app.id}/accounts`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "User with this email address already exists.",
        "statusCode": 409,
      }
    `);
  });

  it('should create with default user properties', async () => {
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
            default: {
              schema: {
                type: 'string',
                default: 'default',
              },
            },
            enum: {
              schema: {
                enum: ['enum'],
              },
            },
            array: {
              schema: {
                type: 'array',
              },
            },
            boolean: {
              schema: {
                type: 'boolean',
              },
            },
            number: {
              schema: {
                type: 'number',
              },
            },
            integer: {
              schema: {
                type: 'integer',
              },
            },
            string: {
              schema: {
                type: 'string',
              },
            },
            object: {
              schema: {
                type: 'object',
                properties: {
                  enum: {
                    enum: ['enum'],
                  },
                  array: {
                    type: 'array',
                  },
                  boolean: {
                    type: 'boolean',
                  },
                  number: {
                    type: 'number',
                  },
                  integer: {
                    type: 'integer',
                  },
                  string: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        resources: {
          tasks: {
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                },
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
    authorizeApp(app);

    const response = await request.post(
      `/api/user/apps/${app.id}/accounts`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(m.properties).toMatchInlineSnapshot(`
      {
        "array": [],
        "boolean": false,
        "default": "default",
        "enum": "enum",
        "integer": 0,
        "number": 0,
        "object": {
          "array": [],
          "boolean": false,
          "enum": "enum",
          "integer": 0,
          "number": 0,
          "string": null,
        },
        "string": null,
      }
    `);
  });
});

describe('registerMemberEmail', () => {
  it('should register valid email addresses', async () => {
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

    const response = await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
        properties: {
          foo: 'bar',
        },
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(m.password).not.toBe('password');
    expect(await compare('password', m.password)).toBe(true);
  });

  it('should accept a display name', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        name: 'Me',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });
    expect(m.name).toBe('Me');
  });

  it('should accept a profile picture', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        name: 'Me',
        password: 'password',
        picture: createFixtureStream('tux.png'),
        timezone: 'Europe/Amsterdam',
      }),
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });

    const responseB = await request.get(`/api/apps/${app.id}/members/${m.id}/picture`, {
      responseType: 'arraybuffer',
    });
    const responseC = await request.get(`/api/apps/${app.id}/members/${m.UserId}/picture`, {
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );
    expect(m.picture).toStrictEqual(await readFixture('tux.png'));
    expect(responseB.data).toStrictEqual(await readFixture('tux.png'));
    expect(responseC.data).toStrictEqual(await readFixture('tux.png'));
  });

  it('should not register invalid email addresses', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({ email: 'foo', password: 'bar', timezone: 'Europe/Amsterdam' }),
    );

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
          {
            "argument": 8,
            "instance": "bar",
            "message": "does not meet minimum length of 8",
            "name": "minLength",
            "path": [
              "password",
            ],
            "property": "instance.password",
            "schema": {
              "minLength": 8,
              "type": "string",
            },
            "stack": "instance.password does not meet minimum length of 8",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not register duplicate email addresses', async () => {
    const app = await createDefaultApp(organization);

    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      role: 'User',
      email: 'test@example.com',
    });

    const response = await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "User with this email address already exists.",
        "statusCode": 409,
      }
    `);
  });
});

describe('verifyMemberEmail', () => {
  it('should verify existing email addresses', async () => {
    const app = await createDefaultApp(organization);

    await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });

    expect(m.emailVerified).toBe(false);
    expect(m.emailKey).not.toBeNull();

    const response = await request.post(`/api/user/apps/${app.id}/account/verify`, {
      token: m.emailKey,
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);

    await m.reload();
    expect(m.emailVerified).toBe(true);
    expect(m.emailKey).toBeNull();
  });

  it('should not verify empty or invalid keys', async () => {
    const app = await createDefaultApp(organization);

    const responseA = await request.post(`/api/user/apps/${app.id}/account/verify`);
    const responseB = await request.post(`/api/user/apps/${app.id}/account/verify`, {
      token: null,
    });
    const responseC = await request.post(`/api/user/apps/${app.id}/account/verify`, {
      token: 'invalidkey',
    });

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 415 Unsupported Media Type
      Content-Type: text/plain; charset=utf-8

      Unsupported Media Type
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": [
              "string",
            ],
            "instance": null,
            "message": "is not of a type(s) string",
            "name": "type",
            "path": [
              "token",
            ],
            "property": "instance.token",
            "schema": {
              "type": "string",
            },
            "stack": "instance.token is not of a type(s) string",
          },
        ],
        "message": "JSON schema validation failed",
      }
    `);
    expect(responseC).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Unable to verify this token.",
        "statusCode": 404,
      }
    `);
  });
});

describe('requestMemberResetPassword', () => {
  it('should create a password reset token', async () => {
    const app = await createDefaultApp(organization);

    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    await request.post(`/api/user/apps/${app.id}/account`, createFormData(data));

    const responseA = await request.post(`/api/user/apps/${app.id}/account/reset/request`, {
      email: data.email,
    });

    const m = await AppMember.findOne({ where: { email: data.email } });
    const responseB = await request.post(`/api/user/apps/${app.id}/account/reset`, {
      token: m.resetKey,
      password: 'newPassword',
    });

    await m.reload();

    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(await compare('newPassword', m.password)).toBe(true);
    expect(m.resetKey).toBeNull();
  });

  it('should not reveal existing emails', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(`/api/user/apps/${app.id}/account/reset/request`, {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });
});

describe('resetMemberPassword', () => {
  it('should return not found when resetting using a non-existent token', async () => {
    const app = await createDefaultApp(organization);

    const response = await request.post(`/api/apps/${app.id}/account/reset`, {
      token: 'idontexist',
      password: 'whatever',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "URL not found",
        "statusCode": 404,
      }
    `);
  });
});

describe('getAppMemberPicture', () => {
  it('should fetch the app member’s profile picture', async () => {
    const app = await createDefaultApp(organization);
    await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        picture: createFixtureStream('tux.png'),
        timezone: 'Europe/Amsterdam',
      }),
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });
    const response = await request.get(`/api/apps/${app.id}/members/${m.id}/picture`, {
      responseType: 'arraybuffer',
    });

    expect(response.data).toStrictEqual(await readFixture('tux.png'));
  });

  it('should return 404 if the user has not uploaded a picture', async () => {
    const app = await createDefaultApp(organization);
    await request.post(
      `/api/user/apps/${app.id}/account`,
      createFormData({
        email: 'test@example.com',
        password: 'password',
        timezone: 'Europe/Amsterdam',
      }),
    );

    const m = await AppMember.findOne({ where: { email: 'test@example.com' } });
    const response = await request.get(`/api/apps/${app.id}/members/${m.id}/picture`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "This member has no profile picture set.",
        "statusCode": 404,
      }
    `);
  });
});

describe('updateAppMemberByEmail', () => {
  it('should update another app member', async () => {
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

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
    });

    const readerUser = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const readerMember = await AppMember.create({
      UserId: readerUser.id,
      AppId: app.id,
      name: 'Reader',
      email: 'reader@gmail.com',
      role: 'Reader',
      properties: {},
    });

    authorizeApp(app);
    const formData = createFormData({
      email: 'reader.updated@gmail.com',
      password: 'new-password',
      properties: {
        foo: 'bar',
      },
    });
    const { data } = await request.patch(
      `/api/user/apps/${app.id}/accounts/reader@gmail.com`,
      formData,
    );
    expect(data).toStrictEqual({
      email: 'reader.updated@gmail.com',
      AppId: 1,
      UserId: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      consent: null,
      created: '1970-01-01T00:00:00.000Z',
      emailVerified: false,
      id: readerMember.id,
      locale: null,
      name: 'Reader',
      properties: {
        foo: 'bar',
      },
      resetKey: null,
      role: 'Reader',
      scimActive: null,
      scimExternalId: null,
      updated: '1970-01-01T00:00:00.000Z',
    });
  });

  it('should self update', async () => {
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
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const adminMember = await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
    });

    authorizeApp(app);
    const formData = createFormData({
      email: 'admin.updated@gmail.com',
      password: 'new-password',
    });
    const { data } = await request.patch(
      `/api/user/apps/${app.id}/accounts/admin@gmail.com`,
      formData,
    );
    expect(data).toStrictEqual({
      email: 'admin.updated@gmail.com',
      AppId: 1,
      UserId: user.id,
      consent: null,
      created: '1970-01-01T00:00:00.000Z',
      emailVerified: false,
      id: adminMember.id,
      locale: null,
      name: 'Admin',
      properties: {},
      resetKey: null,
      role: 'Admin',
      scimActive: null,
      scimExternalId: null,
      updated: '1970-01-01T00:00:00.000Z',
    });
  });
});

describe('getAppMembersByRoles', () => {
  it('should fetch app members by supported roles', async () => {
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
            Role1: {},
            Role2: {},
            Role3: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Test Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
      properties: {},
    });

    const user1 = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember1 = await AppMember.create({
      UserId: user1.id,
      AppId: app.id,
      name: 'Test Member 1',
      email: 'role1@gmail.com',
      role: 'Role1',
      properties: {},
    });

    const user2 = await User.create({
      id: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember2 = await AppMember.create({
      UserId: user2.id,
      AppId: app.id,
      name: 'Test Member 2',
      email: 'role2@gmail.com',
      role: 'Role2',
      properties: {},
    });

    authorizeApp(app);
    const { data } = await request.get(`/api/user/apps/${app.id}/accounts?roles=Role1,Role2`);

    expect(data).toStrictEqual([
      {
        userId: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
        name: 'Test Member 2',
        primaryEmail: 'role2@gmail.com',
        properties: {},
        memberId: appMember2.id,
        role: 'Role2',
      },
      {
        userId: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
        name: 'Test Member 1',
        primaryEmail: 'role1@gmail.com',
        properties: {},
        memberId: appMember1.id,
        role: 'Role1',
      },
    ]);
  });

  it('should fetch all app members except the default role when provided with unsupported roles', async () => {
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
            Role1: {},
            Role2: {},
            Role3: {},
            Admin: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Test Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
      properties: {},
    });

    const user1 = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember1 = await AppMember.create({
      UserId: user1.id,
      AppId: app.id,
      name: 'Test Member 1',
      email: 'role1@gmail.com',
      role: 'Role1',
      properties: {},
    });

    const user2 = await User.create({
      id: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember2 = await AppMember.create({
      UserId: user2.id,
      AppId: app.id,
      name: 'Test Member 2',
      email: 'role2@gmail.com',
      role: 'Role2',
      properties: {},
    });

    const user3 = await User.create({
      id: '5659cad5-7618-4a74-b03d-691d97ba6461',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const appMember3 = await AppMember.create({
      UserId: user3.id,
      AppId: app.id,
      name: 'Test Member 3',
      email: 'role3@gmail.com',
      role: 'Role3',
      properties: {},
    });

    authorizeApp(app);
    const { data } = await request.get(`/api/user/apps/${app.id}/accounts?roles=`);

    expect(data).toStrictEqual([
      {
        userId: '5659cad5-7618-4a74-b03d-691d97ba6461',
        name: 'Test Member 3',
        primaryEmail: 'role3@gmail.com',
        properties: {},
        role: 'Role3',
        memberId: appMember3.id,
      },
      {
        userId: 'cbf06bd7-5b5f-40b2-aba1-1a55edc237e2',
        name: 'Test Member 2',
        primaryEmail: 'role2@gmail.com',
        properties: {},
        role: 'Role2',
        memberId: appMember2.id,
      },
      {
        userId: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
        name: 'Test Member 1',
        primaryEmail: 'role1@gmail.com',
        properties: {},
        role: 'Role1',
        memberId: appMember1.id,
      },
    ]);
  });
});

describe('deleteAppMemberByEmail', () => {
  it('should delete another app member by email', async () => {
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
            Admin: {},
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
    });

    const readerUser = await User.create({
      id: 'd5949885-9b31-4f4f-b842-f3ce80c03287',
      name: 'Foo',
      primaryEmail: 'foo@example.com',
      timezone: 'Europe/Amsterdam',
    });

    await AppMember.create({
      UserId: readerUser.id,
      AppId: app.id,
      name: 'Reader',
      email: 'reader@gmail.com',
      role: 'Reader',
      properties: {},
    });

    authorizeApp(app);
    await request.delete(`/api/user/apps/${app.id}/accounts/reader@gmail.com`);

    const readerAfterDeletion = await AppMember.findOne({
      where: {
        email: 'reader@gmail.com',
      },
    });

    expect(readerAfterDeletion).toBeNull();
  });

  it('should delete own account by email', async () => {
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
            Admin: {},
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'Admin',
    });

    authorizeApp(app);
    await request.delete(`/api/user/apps/${app.id}/accounts/admin@gmail.com`);

    const readerAfterDeletion = await AppMember.findOne({
      where: {
        email: 'admin@gmail.com',
      },
    });

    expect(readerAfterDeletion).toBeNull();
  });
});
