import { type LoginCodeResponse, type OAuth2ClientCredentials } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  OAuth2AuthorizationCode,
  Organization,
  OrganizationMember,
  User,
} from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser, getTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;
let mock: MockAdapter;
let member: OrganizationMember;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(() => {
  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  vi.clearAllTimers();
  vi.setSystemTime(0);
  mock = new MockAdapter(axios);
});

beforeEach(async () => {
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  app = await App.create({
    OrganizationId: organization.id,
    vapidPublicKey: '',
    vapidPrivateKey: '',
    definition: {
      security: {
        default: {
          role: 'Test',
          policy: 'everyone',
        },
        roles: { Test: {} },
      },
    },
  });
  member = await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });
});

// https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
afterAll(() => {
  vi.useRealTimers();
});

describe('createAppOAuth2Secret', () => {
  it('should be possible to create an app secret', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://example.com/oauth/authorize",
        "clientId": "example_client_id",
        "clientSecret": "example_client_secret",
        "icon": "example",
        "id": 1,
        "name": "Example",
        "scope": "email openid profile",
        "tokenUrl": "https://example.com/oauth/token",
        "userInfoUrl": "https://example.com/oauth/userinfo",
      }
    `);
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/99999/secrets/oauth2', {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
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

  it('should require a login with Appsemble Studio', async () => {
    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });
});

describe('getAppOAuth2Secrets', () => {
  it('should return OAuth2 secrets for an app', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.get<OAuth2ClientCredentials[]>(
      `/api/apps/${app.id}/secrets/oauth2`,
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "authorizationUrl": "https://example.com/oauth/authorize",
          "clientId": "example_client_id",
          "clientSecret": "example_client_secret",
          "created": "1970-01-01T00:00:00.000Z",
          "icon": "example",
          "id": 1,
          "name": "Example",
          "remapper": null,
          "scope": "email openid profile",
          "tokenUrl": "https://example.com/oauth/token",
          "updated": "1970-01-01T00:00:00.000Z",
          "userInfoUrl": "https://example.com/oauth/userinfo",
        },
      ]
    `);
    expect(response.data[0].id).toBe(secret.id);
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.get('/api/apps/99999/secrets/oauth2');
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

  it('should require a login with Appsemble Studio', async () => {
    const response = await request.get(`/api/apps/${app.id}/secrets/oauth2`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });
});

describe('getAppOAuth2Secret', () => {
  it('should return a partial OAuth2 secret', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    const response = await request.get(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://example.com/oauth/authorize",
        "clientId": "example_client_id",
        "scope": "email openid profile",
      }
    `);
  });
});

describe('updateAppOAuth2Secret', () => {
  it('should update an OAuth2 secret', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://other.example/oauth/authorize",
        "clientId": "other_client_id",
        "clientSecret": "example_client_secret",
        "created": "1970-01-01T00:00:00.000Z",
        "icon": "updated",
        "id": 1,
        "name": "Updated Example",
        "remapper": null,
        "scope": "custom",
        "tokenUrl": "https://other.example/oauth/token",
        "updated": "1970-01-01T00:00:00.000Z",
        "userInfoUrl": "https://other.example/oauth/userinfo",
      }
    `);
    await secret.reload();
    expect(secret).toMatchObject({
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
  });

  it('should update AppOAuth2Secret.userInfoUrl to be null when undefined', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "authorizationUrl": "https://other.example/oauth/authorize",
        "clientId": "other_client_id",
        "clientSecret": "example_client_secret",
        "created": "1970-01-01T00:00:00.000Z",
        "icon": "updated",
        "id": 1,
        "name": "Updated Example",
        "remapper": null,
        "scope": "custom",
        "tokenUrl": "https://other.example/oauth/token",
        "updated": "1970-01-01T00:00:00.000Z",
        "userInfoUrl": null,
      }
    `);
    await secret.reload();
    expect(secret).toMatchObject({
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: null,
    });
  });

  it('should handle if the app id is invalid', async () => {
    authorizeStudio();
    const response = await request.put('/api/apps/123/secrets/oauth2/1', {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
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

  it('should handle if the secret id is invalid', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/1`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "OAuth2 secret not found",
        "statusCode": 404,
      }
    `);
  });

  it('should require the user to have correct permissions', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    await member.update({ role: 'Member' });
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`, {
      authorizationUrl: 'https://other.example/oauth/authorize',
      clientId: 'other_client_id',
      clientSecret: 'example_client_secret',
      icon: 'updated',
      name: 'Updated Example',
      scope: 'custom',
      tokenUrl: 'https://other.example/oauth/token',
      userInfoUrl: 'https://other.example/oauth/userinfo',
    });
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
});

describe('deleteAppOAuth2Secret', () => {
  it('should delete an OAuth2 secret', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`);
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should handle if the app id is invalid', async () => {
    authorizeStudio();
    const response = await request.delete('/api/apps/123/secrets/oauth2/1');
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

  it('should handle if the secret id is invalid', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/secrets/oauth2/1`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "OAuth2 secret not found",
        "statusCode": 404,
      }
    `);
  });

  it('should require the user to have correct permissions', async () => {
    const secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    await member.update({ role: 'Member' });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/secrets/oauth2/${secret.id}`);
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
});

describe('deleteAppOAuth2Secrets', () => {
  it('should delete all OAuth2 secrets', async () => {
    await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/secrets/oauth2`);
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should require the user to have correct permissions', async () => {
    await member.update({ role: 'Member' });
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/secrets/oauth2`);
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
});

describe('verifyAppOAuth2SecretCode', () => {
  let secret: AppOAuth2Secret;

  beforeEach(async () => {
    secret = await AppOAuth2Secret.create({
      AppId: app.id,
      authorizationUrl: 'https://example.com/oauth/authorize',
      clientId: 'example_client_id',
      clientSecret: 'example_client_secret',
      icon: 'example',
      name: 'Example',
      scope: 'email openid profile',
      tokenUrl: 'https://example.com/oauth/token',
      userInfoUrl: 'https://example.com/oauth/userinfo',
    });
  });

  it('should throw 400 if the referer is missing', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/9999/secrets/oauth2/${secret.id}/verify`, {
      code: 'authorization_code',
      redirectUri: 'http://localhost',
      scope: 'resources:manage',
      timezone: 'Europe/Amsterdam',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "The referer header is invalid",
        "statusCode": 400,
      }
    `);
  });

  it('should throw 400 if the referer is invalid', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/9999/secrets/oauth2/${secret.id}/verify`, {
      code: 'authorization_code',
      redirectUri: 'http://localhost',
      scope: 'resources:manage',
      timezone: 'Europe/Amsterdam',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "The referer header is invalid",
        "statusCode": 400,
      }
    `);
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/9999/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://localhost',
        scope: 'resources:manage',
        timezone: 'Europe/Amsterdam',
      },
      { headers: { referer: 'http://localhost' } },
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

  it('should throw 404 if no secret is found', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/secrets/oauth2/9999/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://localhost',
        scope: 'resources:manage',
        timezone: 'Europe/Amsterdam',
      },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "OAuth2 secret not found",
        "statusCode": 404,
      }
    `);
  });

  it('should trade the authorization code for an Appsemble authorization code', async () => {
    const accessToken = jwt.sign(
      {
        email: 'user@example.com',
        emailVerified: true,
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.jpg',
        sub: '42',
      },
      'random',
    );
    mock.onPost('https://example.com/oauth/token').reply(200, {
      access_token: accessToken,
      id_token: '',
      refresh_token: '',
      token_type: 'bearer',
    });

    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://app.appsemble.localhost',
        scope: 'resources:manage',
        timezone: 'Europe/Amsterdam',
      },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchInlineSnapshot(
      { data: { code: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "code": Any<String>,
      }
    `,
    );

    const auth = await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    });
    expect(auth).toMatchObject({
      expires: expect.any(Date),
      redirectUri: 'http://app.appsemble.localhost',
      scope: 'resources:manage',
      UserId: getTestUser().id,
    });
  });

  it('should find Appsemble user with authorization if not already logged in', async () => {
    const oauth2User = {
      email: 'user@example.com',
      emailVerified: true,
      name: 'User',
      profile: 'https://example.com/user',
      picture: 'https://example.com/user.jpg',
      sub: '42',
    };
    const accessToken = jwt.sign(oauth2User, 'random');
    const idToken = jwt.sign(oauth2User, 'random');
    mock.onPost('https://example.com/oauth/token').reply(200, {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: '',
      token_type: 'bearer',
    });
    const appMember = await AppMember.create({
      UserId: getTestUser().id,
      AppId: app.id,
      role: 'Test',
      ...oauth2User,
    });
    await AppOAuth2Authorization.create({
      accessToken,
      AppOAuth2SecretId: secret.id,
      refreshToken: '',
      sub: '42',
      AppMemberId: appMember.id,
    });

    const response = await request.post<LoginCodeResponse>(
      `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://app.appsemble.localhost',
        scope: 'resources:manage',
        timezone: 'Europe/Amsterdam',
      },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchInlineSnapshot(
      { data: { code: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "code": Any<String>,
      }
    `,
    );

    const auth = await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    });
    expect(auth).toMatchObject({
      expires: expect.any(Date),
      redirectUri: 'http://app.appsemble.localhost',
      scope: 'resources:manage',
      UserId: getTestUser().id,
    });
  });

  it('should create a new user when no associated user could be found', async () => {
    const oauth2User = {
      email: 'user@example.com',
      emailVerified: true,
      name: 'User',
      profile: 'https://example.com/user',
      picture: 'https://example.com/user.jpg',
      sub: '42',
    };
    const accessToken = jwt.sign(oauth2User, 'random');
    const idToken = jwt.sign(oauth2User, 'random');
    mock.onPost('https://example.com/oauth/token').reply(200, {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: '',
      token_type: 'bearer',
    });

    const response = await request.post<LoginCodeResponse>(
      `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://app.appsemble.localhost',
        scope: 'resources:manage',
        timezone: 'Europe/Amsterdam',
      },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchInlineSnapshot(
      { data: { code: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "code": Any<String>,
      }
    `,
    );

    const auth = await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    });
    expect(auth.UserId).not.toBe(getTestUser().id);
    expect(auth).toMatchObject({
      expires: expect.any(Date),
      redirectUri: 'http://app.appsemble.localhost',
      scope: 'resources:manage',
      UserId: expect.any(String),
    });

    const user = await User.findByPk(auth.UserId);
    expect(user).toMatchObject({
      created: expect.any(Date),
      deleted: null,
      demoLoginUser: false,
      locale: null,
      name: null,
      password: null,
      primaryEmail: null,
      subscribed: true,
      timezone: 'Europe/Amsterdam',
      updated: expect.any(Date),
    });
  });

  it('should create a new appMember when user is authorized', async () => {
    const accessToken = jwt.sign(
      {
        email: 'user@example.com',
        emailVerified: true,
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.jpg',
        sub: '42',
      },
      'random',
    );
    mock.onPost('https://example.com/oauth/token').reply(200, {
      access_token: accessToken,
      id_token: '',
      refresh_token: '',
      token_type: 'bearer',
    });

    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://app.appsemble.localhost',
        scope: 'resources:manage',
        timezone: 'Europe/Amsterdam',
      },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchInlineSnapshot(
      { data: { code: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "code": Any<String>,
      }
    `,
    );

    const auth = await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    });
    expect(auth).toMatchObject({
      expires: expect.any(Date),
      redirectUri: 'http://app.appsemble.localhost',
      scope: 'resources:manage',
      UserId: getTestUser().id,
    });

    const user = await User.findByPk(auth.UserId, { include: ['AppMembers'] });
    expect(user.AppMembers[0]).toMatchObject({
      created: expect.any(Date),
      locale: null,
      AppId: 1,
      consent: null,
      password: null,
      UserId: user.id,
      name: 'User',
      email: 'user@example.com',
      emailKey: null,
      emailVerified: false,
      id: expect.any(String),
      picture: null,
      properties: {},
      resetKey: null,
      role: 'Test',
      scimActive: null,
      scimExternalId: null,
      updated: expect.any(Date),
    });
  });
});
