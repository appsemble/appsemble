import { LoginCodeResponse } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { sign } from 'jsonwebtoken';

import { App, AppOAuth2Secret, Member, OAuth2AuthorizationCode, Organization } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import * as oauth2 from '../utils/oauth2';
import { authorizeStudio, createTestUser, getTestUser } from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

let app: App;
let member: Member;

useTestDatabase('appnotifications');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
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
    expect(response).toMatchObject({
      status: 201,
      data: {
        AppId: app.id,
        authorizationUrl: 'https://example.com/oauth/authorize',
        clientId: 'example_client_id',
        clientSecret: 'example_client_secret',
        icon: 'example',
        id: expect.any(Number),
        name: 'Example',
        scope: 'email openid profile',
        tokenUrl: 'https://example.com/oauth/token',
        userInfoUrl: 'https://example.com/oauth/userinfo',
      },
    });
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
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
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
    expect(response).toMatchObject({
      status: 401,
      data: 'Unauthorized',
    });
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
    const response = await request.get(`/api/apps/${app.id}/secrets/oauth2`);
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          authorizationUrl: 'https://example.com/oauth/authorize',
          clientId: 'example_client_id',
          clientSecret: 'example_client_secret',
          icon: 'example',
          id: secret.id,
          name: 'Example',
          scope: 'email openid profile',
          tokenUrl: 'https://example.com/oauth/token',
          userInfoUrl: 'https://example.com/oauth/userinfo',
        },
      ],
    });
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.get('/api/apps/99999/secrets/oauth2');
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });

  it('should require a login with Appsemble Studio', async () => {
    const response = await request.get(`/api/apps/${app.id}/secrets/oauth2`);
    expect(response).toMatchObject({
      status: 401,
      data: 'Unauthorized',
    });
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
    expect(response).toMatchObject({
      status: 200,
      data: {
        authorizationUrl: 'https://example.com/oauth/authorize',
        clientId: 'example_client_id',
        scope: 'email openid profile',
      },
    });
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
    expect(response).toMatchObject({
      status: 200,
      data: {
        authorizationUrl: 'https://other.example/oauth/authorize',
        clientId: 'other_client_id',
        clientSecret: 'example_client_secret',
        icon: 'updated',
        name: 'Updated Example',
        scope: 'custom',
        tokenUrl: 'https://other.example/oauth/token',
        userInfoUrl: 'https://other.example/oauth/userinfo',
      },
    });
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
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
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
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'OAuth2 secret not found', statusCode: 404 },
    });
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
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
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
    });
    expect(response).toMatchObject({
      status: 400,
      data: { error: 'Bad Request', message: 'The referer header is invalid', statusCode: 400 },
    });
  });

  it('should throw 400 if the referer is invalid', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/9999/secrets/oauth2/${secret.id}/verify`, {
      code: 'authorization_code',
      redirectUri: 'http://localhost',
      scope: 'resources:manage',
    });
    expect(response).toMatchObject({
      status: 400,
      data: { error: 'Bad Request', message: 'The referer header is invalid', statusCode: 400 },
    });
  });

  it('should throw 404 if no app is found', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/9999/secrets/oauth2/${secret.id}/verify`,
      { code: 'authorization_code', redirectUri: 'http://localhost', scope: 'resources:manage' },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });

  it('should throw 404 if no secret is found', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/apps/${app.id}/secrets/oauth2/9999/verify`,
      { code: 'authorization_code', redirectUri: 'http://localhost', scope: 'resources:manage' },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'OAuth2 secret not found', statusCode: 404 },
    });
  });

  it('should trade the authorization code for an Appsemble authorization code', async () => {
    const accessToken = sign(
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
    jest.spyOn(oauth2, 'getAccessToken').mockResolvedValue({
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
      },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: { code: expect.any(String) },
    });

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
