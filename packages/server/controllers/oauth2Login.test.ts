import axios, { AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import { sign } from 'jsonwebtoken';

import { EmailAuthorization, OAuthAuthorization, User } from '../models';
import { argv, setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

const mock = new MockAdapter(axios);
let user: User;

useTestDatabase('oauth2login');

beforeEach(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
  user = await createTestUser();
});

afterEach(() => {
  mock.reset();
});

describe('registerOAuth2Connection', () => {
  it('should throw if the referer header is missing', async () => {
    const response = await request.post('/api/oauth2/connect/register', {
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
      '/api/oauth2/connect/register',
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
      '/api/oauth2/connect/register',
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
    let tokenRequest: AxiosRequestConfig;
    mock.onPost('https://gitlab.com/oauth/token').reply((config) => {
      tokenRequest = config;
      return [
        200,
        {
          access_token: 'access.token',
          id_token: sign(
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
      '/api/oauth2/connect/register',
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
        profile: 'https://example.com/user',
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
    let tokenRequest: AxiosRequestConfig;
    mock.onPost('https://gitlab.com/oauth/token').reply((config) => {
      tokenRequest = config;
      return [
        200,
        {
          access_token: 'access.token',
          id_token: sign(
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

    await OAuthAuthorization.create({
      UserId: user.id,
      accessToken: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      sub: '123',
    });
    const response = await request.post(
      '/api/oauth2/connect/register',
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

describe('connectPendingOAuth2Profile', () => {
  it('should throw if the authorization URL is not implemented', async () => {
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: '',
      code: '',
    });
    expect(response).toMatchObject({
      status: 501,
      data: {
        error: 'Not Implemented',
        message: 'Unknown authorization URL',
        statusCode: 501,
      },
    });
  });

  it('should throw if no pending authorization is found', async () => {
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'No pending OAuth2 authorization found for given state',
        statusCode: 404,
      },
    });
  });

  it('should link the logged in user if authorization isn’t linked yet', async () => {
    const oauthAuthorization = await OAuthAuthorization.create({
      accessToken: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    authorizeStudio();
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
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
    await oauthAuthorization.reload();
    expect(oauthAuthorization.UserId).toBe(user.id);
  });

  it('should throw if the authorization is linked to another user', async () => {
    const userB = await User.create();
    const oauthAuthorization = await OAuthAuthorization.create({
      UserId: userB.id,
      accessToken: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    authorizeStudio();
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
    });
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'This OAuth2 authorization is already linked to an account.',
        statusCode: 403,
      },
    });
    await oauthAuthorization.reload();
    expect(oauthAuthorization.UserId).toBe(userB.id);
  });

  it('should create a new user if the user isn’t logged in', async () => {
    const oauthAuthorization = await OAuthAuthorization.create({
      accessToken: sign(
        {
          email: 'me@example.com',
          name: 'Me',
          picture: 'https://example.com/me.jpg',
          profile: 'https://example.com/me',
          sub: '42',
        },
        'secret',
      ),
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
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
    await oauthAuthorization.reload();
    expect(oauthAuthorization.UserId).toBeDefined();
  });

  it('should throw a conflict if the email address conflicts with another user', async () => {
    const userB = await User.create({ primaryEmail: 'me@example.com' });
    await EmailAuthorization.create({ UserId: userB.id, email: 'me@example.com' });
    await OAuthAuthorization.create({
      accessToken: sign(
        {
          email: 'me@example.com',
          name: 'Me',
          picture: 'https://example.com/me.jpg',
          profile: 'https://example.com/me',
          sub: '42',
        },
        'secret',
      ),
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
    });
    expect(response).toMatchObject({
      status: 409,
      data: {
        error: 'Conflict',
        message: 'This email address has already been linked to an existing account.',
        statusCode: 409,
      },
    });
  });

  it('should create an email authorization if a new email address is registered', async () => {
    const oauthAuthorization = await OAuthAuthorization.create({
      accessToken: sign(
        {
          email: 'me@example.com',
          name: 'Me',
          picture: 'https://example.com/me.jpg',
          profile: 'https://example.com/me',
          sub: '42',
        },
        'secret',
      ),
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    const response = await request.post('/api/oauth2/connect/pending', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
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
    await oauthAuthorization.reload();
    const emailAuthorization = await EmailAuthorization.findOne({
      where: { email: 'me@example.com' },
    });
    expect(emailAuthorization.UserId).toBe(oauthAuthorization.UserId);
  });
});

describe('getConnectedAccounts', () => {
  it('should return the linked accounts of the logged in user', async () => {
    await OAuthAuthorization.create({
      UserId: user.id,
      accessToken: '',
      authorizationUrl: 'https://a.example',
      sub: 'aubA',
    });

    const userB = await User.create();
    await OAuthAuthorization.create({
      UserId: userB.id,
      accessToken: '',
      authorizationUrl: 'https://b.example',
      sub: 'aubB',
    });

    authorizeStudio();
    const response = await request.get('/api/oauth2/connected');
    expect(response).toMatchObject({
      status: 200,
      data: [{ authorizationUrl: 'https://a.example' }],
    });
  });
});

describe('unlinkConnectedAccount', () => {
  it('should delete a linked account', async () => {
    const oauthAuthorization = await OAuthAuthorization.create({
      UserId: user.id,
      accessToken: '',
      authorizationUrl: 'https://a.example',
      sub: 'aubA',
    });

    authorizeStudio();
    const response = await request.delete('/api/oauth2/connected', {
      params: { authorizationUrl: 'https://a.example' },
    });
    expect(response).toMatchObject({
      status: 204,
      data: '',
    });

    await expect(oauthAuthorization.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not delete a linked account for another user', async () => {
    const userB = await User.create();
    await OAuthAuthorization.create({
      UserId: userB.id,
      accessToken: '',
      authorizationUrl: 'https://b.example',
      sub: 'aubB',
    });

    authorizeStudio();
    const response = await request.delete('/api/oauth2/connected', {
      params: { authorizationUrl: 'https://b.example' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'OAuth2 account to unlink not found',
        statusCode: 404,
      },
    });
  });
});
