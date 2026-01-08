import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EmailAuthorization, OAuthAuthorization, User } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

const mock = new MockAdapter(axios);
let user: User;

describe('connectOAuth2Authorization', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
    user = await createTestUser();
  });

  afterEach(() => {
    mock.reset();
  });

  it('should throw if the authorization URL is not implemented', async () => {
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: '',
      code: '',
      timezone: 'Europe/Amsterdam',
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
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      timezone: 'Europe/Amsterdam',
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
      email: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    authorizeStudio();
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      timezone: 'Europe/Amsterdam',
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
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    const oauthAuthorization = await OAuthAuthorization.create({
      UserId: userB.id,
      email: 'email@example.com',
      accessToken: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    authorizeStudio();
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      timezone: 'Europe/Amsterdam',
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
    const accessToken = jwt.sign(
      {
        email: 'me@example.com',
        name: 'Me',
        picture: 'https://example.com/me.jpg',
        profile: 'https://example.com/me',
        sub: '42',
      },
      // Test secret for mocking OAuth2 token
      // nosemgrep: nodejs_scan.javascript-jwt-rule-hardcoded_jwt_secret
      'secret',
    );
    mock.onPost('https://gitlab.com/oauth/authorize').reply(200, {
      access_token: accessToken,
      id_token: '',
      refresh_token: '',
      token_type: 'bearer',
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
    const oauthAuthorization = await OAuthAuthorization.create({
      accessToken,
      email: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      timezone: 'Europe/Amsterdam',
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
    const accessToken = jwt.sign(
      {
        email: 'me@example.com',
        name: 'Me',
        picture: 'https://example.com/me.jpg',
        profile: 'https://example.com/me',
        sub: '42',
      },
      // Test secret for mocking OAuth2 token
      // nosemgrep: nodejs_scan.javascript-jwt-rule-hardcoded_jwt_secret
      'secret',
    );
    mock.onPost('https://gitlab.com/oauth/authorize').reply(200, {
      access_token: accessToken,
      id_token: '',
      refresh_token: '',
      token_type: 'bearer',
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
    const userB = await User.create({
      primaryEmail: 'me@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userB.id, email: 'me@example.com' });
    await OAuthAuthorization.create({
      accessToken,
      email: userB.primaryEmail,
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      timezone: 'Europe/Amsterdam',
    });
    expect(response).toMatchObject({
      status: 409,
      data: {
        error: 'Conflict',
        message: 'This email address has already been linked to an existing account',
        statusCode: 409,
      },
    });
  });

  it('should create an email authorization if a new email address is registered', async () => {
    const accessToken = jwt.sign(
      {
        email: 'me@example.com',
        name: 'Me',
        picture: 'https://example.com/me.jpg',
        profile: 'https://example.com/me',
        sub: '42',
      },
      // Test secret for mocking OAuth2 token
      // nosemgrep: nodejs_scan.javascript-jwt-rule-hardcoded_jwt_secret
      'secret',
    );
    mock.onPost('https://gitlab.com/oauth/authorize').reply(200, {
      access_token: accessToken,
      id_token: '',
      refresh_token: '',
      token_type: 'bearer',
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
    const oauthAuthorization = await OAuthAuthorization.create({
      accessToken,
      email: '',
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      sub: '42',
    });
    const response = await request.post('/api/auth/oauth2/authorizations/connect', {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      code: '789',
      timezone: 'Europe/Amsterdam',
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
    const emailAuthorization = (await EmailAuthorization.findOne({
      where: { email: 'me@example.com' },
    }))!;
    expect(emailAuthorization.UserId).toBe(oauthAuthorization.UserId);
  });
});
