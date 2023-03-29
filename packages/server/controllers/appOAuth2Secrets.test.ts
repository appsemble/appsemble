import { createServer } from '@appsemble/node-utils/createServer.js';
import { LoginCodeResponse, OAuth2ClientCredentials } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';

import {
  App,
  AppOAuth2Secret,
  Member,
  OAuth2AuthorizationCode,
  Organization,
} from '../models/index.js';
import { appRouter } from '../routes/appRouter/index.js';
import { argv, setArgv } from '../utils/argv.js';
import { authorizeStudio, createTestUser, getTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';
import * as controllers from './index.js';

let app: App;
let mock: MockAdapter;
let member: Member;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer({
    argv,
    appRouter,
    controllers,
  });
  await setTestApp(server);
});

beforeEach(() => {
  import.meta.jest.useFakeTimers({ now: 0 });
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
  member = await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
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
        "AppId": 1,
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
});
