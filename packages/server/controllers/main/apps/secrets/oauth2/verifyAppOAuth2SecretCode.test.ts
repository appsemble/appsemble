import { type LoginCodeResponse, PredefinedOrganizationRole } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppOAuth2Secret,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import {
  authorizeStudio,
  createTestUser,
  getTestUser,
} from '../../../../../utils/test/authorization.js';

let app: App;
let mock: MockAdapter;
let user: User;

describe('verifyAppOAuth2SecretCode', () => {
  let secret: AppOAuth2Secret;

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
    mock = new MockAdapter(axios);

    user = await createTestUser();
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
      path: 'test-app',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    const { AppOAuth2Secret } = await getAppDB(app.id);
    secret = await AppOAuth2Secret.create({
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

  // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
  afterAll(() => {
    vi.useRealTimers();
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
    mock.onGet('https://example.com/oauth/userinfo').reply(200, {});

    authorizeStudio();
    const response = await request.post<LoginCodeResponse>(
      `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://test-app.testorganization.localhost',
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

    const { OAuth2AuthorizationCode } = await getAppDB(app.id);
    const auth = await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    });
    expect(auth).toMatchObject({
      AppMemberId: expect.any(String),
      code: expect.any(String),
      expires: expect.any(Date),
      redirectUri: 'http://test-app.testorganization.localhost',
      scope: 'resources:manage',
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
      timezone: 'Europe/Amsterdam',
    };
    const accessToken = jwt.sign(oauth2User, 'random');
    const idToken = jwt.sign(oauth2User, 'random');
    mock.onPost('https://example.com/oauth/token').reply(200, {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: '',
      token_type: 'bearer',
    });
    mock.onGet('https://example.com/oauth/userinfo').reply(() => [
      200,
      {
        email: 'user@example.com',
        email_verified: false,
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.png',
        locale: undefined,
        subscribed: false,
        zoneinfo: undefined,
      },
    ]);
    const { AppMember, AppOAuth2Authorization } = await getAppDB(app.id);
    const appMember = await AppMember.create({
      userId: getTestUser().id,
      role: 'Test',
      ...oauth2User,
    });
    await AppOAuth2Authorization.create({
      accessToken,
      AppOAuth2SecretId: secret.id,
      refreshToken: '',
      sub: '42',
      AppMemberId: appMember.id,
      email: appMember.email,
    });

    const response = await request.post<LoginCodeResponse>(
      `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      {
        code: 'authorization_code',
        redirectUri: 'http://test-app.testorganization.localhost',
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

    const { OAuth2AuthorizationCode } = await getAppDB(app.id);
    const auth = await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    });
    expect(auth).toMatchObject({
      expires: expect.any(Date),
      redirectUri: 'http://test-app.testorganization.localhost',
      scope: 'resources:manage',
      code: expect.any(String),
      AppMemberId: expect.any(String),
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
    mock.onGet('https://example.com/oauth/userinfo').reply(() => [
      200,
      {
        email: 'user@example.com',
        email_verified: false,
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.png',
        locale: undefined,
        subscribed: false,
        zoneinfo: undefined,
      },
    ]);
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
        redirectUri: 'http://test-app.testorganization.localhost',
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

    const { AppMember, OAuth2AuthorizationCode } = await getAppDB(app.id);
    const auth = (await OAuth2AuthorizationCode.findOne({
      where: { code: response.data.code },
    }))!;
    expect(auth).toMatchObject({
      expires: expect.any(Date),
      redirectUri: 'http://test-app.testorganization.localhost',
      scope: 'resources:manage',
      AppMemberId: expect.any(String),
      code: response.data.code,
    });

    const member = await AppMember.findByPk(auth.AppMemberId);
    expect(member).toMatchObject({
      created: expect.any(Date),
      locale: null,
      consent: null,
      password: null,
      userId: null,
      demo: false,
      name: 'User',
      email: 'user@example.com',
      emailKey: null,
      emailVerified: false,
      id: expect.any(String),
      picture: null,
      properties: {},
      resetKey: null,
      role: 'Test',
      scimActive: false,
      scimExternalId: null,
      timezone: 'Europe/Amsterdam',
      updated: expect.any(Date),
    });
  });
});
