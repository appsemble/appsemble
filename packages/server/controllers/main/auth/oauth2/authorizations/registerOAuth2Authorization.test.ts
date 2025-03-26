import axios, { type AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OAuthAuthorization, type User } from '../../../../../models/index.js';
import { argv, setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

const mock = new MockAdapter(axios);
let user: User;

describe('registerOAuth2Authorization', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
    user = await createTestUser();
  });

  afterEach(() => {
    mock.reset();
  });

  it('should throw if the referer header is missing', async () => {
    const response = await request.post('/api/auth/oauth2/authorizations/register', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '123',
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'The referer header is invalid',
        statusCode: 400,
      },
    });
  });

  it('should throw if the referer header is invalid', async () => {
    const response = await request.post(
      '/api/auth/oauth2/authorizations/register',
      { authorizationUrl: 'https://gitlab.com/oauth/authorize', code: '123' },
      { headers: { referer: 'invalid' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'The referer header is invalid',
        statusCode: 400,
      },
    });
  });

  it('should throw if no matching client id or client secret has been configured', async () => {
    const response = await request.post(
      '/api/auth/oauth2/authorizations/register',
      { authorizationUrl: 'https://gitlab.com/oauth/authorize', code: '123' },
      { headers: { referer: 'http://localhost' } },
    );
    expect(response).toMatchObject({
      status: 501,
      data: {
        error: 'Not Implemented',
        message: 'Unknown authorization URL',
        statusCode: 501,
      },
    });
  });

  it('should return the user info if the returned authorization response is unknown', async () => {
    argv.gitlabClientId = 'gitlab_client_id';
    argv.gitlabClientSecret = 'gitlab_client_secret';
    let tokenRequest: AxiosRequestConfig | undefined;
    mock.onGet('https://gitlab.com/oauth/userinfo').reply(() => [
      200,
      {
        email: 'me@example.com',
        email_verified: false,
        name: 'User',
        profile: 'https://example.com/user',
        locale: undefined,
        subscribed: false,
        zoneinfo: undefined,
      },
    ]);

    mock.onPost('https://gitlab.com/oauth/token').reply((config) => {
      tokenRequest = config;
      return [
        200,
        {
          access_token: 'access.token',
          id_token: jwt.sign(
            {
              sub: '123',
              name: 'User',
              email: 'user@example.com',
              profile: 'https://example.com/user',
              picture: 'https://exmaple.com/user.jpg',
            },
            'secret',
          ),
        },
      ];
    });

    const response = await request.post(
      '/api/auth/oauth2/authorizations/register',
      { authorizationUrl: 'https://gitlab.com/oauth/authorize', code: '456' },
      { headers: { referer: 'http://localhost/foo?code=456' } },
    );
    expect(tokenRequest).toMatchObject({
      url: 'https://gitlab.com/oauth/token',
      headers: { authorization: 'Basic Z2l0bGFiX2NsaWVudF9pZDpnaXRsYWJfY2xpZW50X3NlY3JldA==' },
      data: 'grant_type=authorization_code&client_id=gitlab_client_id&client_secret=gitlab_client_secret&code=456&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback',
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        email: 'user@example.com',
        name: 'User',
        picture: 'https://exmaple.com/user.jpg',
      },
    });

    const oauthAuthorization = await OAuthAuthorization.findOne();
    expect(oauthAuthorization).toMatchObject({
      UserId: null,
      accessToken: 'access.token',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '456',
      expiresAt: null,
      refreshToken: null,
      sub: '123',
    });
  });

  it('should log in the user if the returned authorization response is known', async () => {
    authorizeStudio();
    argv.gitlabClientId = 'gitlab_client_id';
    argv.gitlabClientSecret = 'gitlab_client_secret';
    let tokenRequest: AxiosRequestConfig | undefined;
    mock.onPost('https://gitlab.com/oauth/token').reply((config) => {
      tokenRequest = config;
      return [
        200,
        {
          access_token: 'access.token',
          id_token: jwt.sign(
            {
              sub: '123',
              name: 'User',
              email: 'user@example.com',
              profile: 'https://example.com/user',
              picture: 'https://exmaple.com/user.jpg',
            },
            'secret',
          ),
        },
      ];
    });
    mock.onGet('https://gitlab.com/oauth/userinfo').reply(() => [
      200,
      {
        email: 'me@example.com',
        email_verified: false,
        name: 'User',
        profile: 'https://example.com/user',
        picture: 'https://example.com/user.png',
        locale: undefined,
        subscribed: false,
        zoneinfo: undefined,
      },
    ]);

    await OAuthAuthorization.create({
      UserId: user.id,
      accessToken: '',
      email: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      sub: '123',
    });
    const response = await request.post(
      '/api/auth/oauth2/authorizations/register',
      { authorizationUrl: 'https://gitlab.com/oauth/authorize', code: '456' },
      { headers: { referer: 'http://localhost/foo?code=456' } },
    );
    expect(tokenRequest).toMatchObject({
      url: 'https://gitlab.com/oauth/token',
      headers: { authorization: 'Basic Z2l0bGFiX2NsaWVudF9pZDpnaXRsYWJfY2xpZW50X3NlY3JldA==' },
      data: 'grant_type=authorization_code&client_id=gitlab_client_id&client_secret=gitlab_client_secret&code=456&redirect_uri=http%3A%2F%2Flocalhost%2Fcallback',
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.any(String),
        expires_in: 3600,
        refresh_token: expect.any(String),
        token_type: 'bearer',
      },
    });

    const oauthAuthorization = await OAuthAuthorization.findOne();
    expect(oauthAuthorization).toMatchObject({
      UserId: user.id,
      accessToken: 'access.token',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      expiresAt: null,
      refreshToken: null,
      sub: '123',
    });
  });
});
