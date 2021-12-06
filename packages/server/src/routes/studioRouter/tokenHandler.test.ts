import { URLSearchParams } from 'url';

import { basicAuth } from '@appsemble/node-utils';
import { TokenResponse } from '@appsemble/types';
import { install, InstalledClock } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { decode } from 'jsonwebtoken';

import { App, OAuth2AuthorizationCode, OAuth2ClientCredentials, User } from '../../models';
import { setArgv } from '../../utils/argv';
import { createJWTResponse } from '../../utils/createJWTResponse';
import { createServer } from '../../utils/createServer';
import { createTestUser } from '../../utils/test/authorization';
import { useTestDatabase } from '../../utils/test/testSchema';

let clock: InstalledClock;
let user: User;

useTestDatabase('tokenhandler');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  clock = install();
  clock.setSystemTime(new Date('2000-01-01T00:00:00Z'));
  user = await createTestUser();
});

afterEach(() => {
  clock.uninstall();
});

it('should not accept invalid content types', async () => {
  const response = await request.post('/oauth2/token', {});
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'invalid_request',
    },
  });
});

it('should not accept missing grant types', async () => {
  const response = await request.post('/oauth2/token', '');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'unsupported_grant_type',
    },
  });
});

it('should not accept unsupported grant types', async () => {
  const response = await request.post('/oauth2/token', 'grant_type=unsupported');
  expect(response).toMatchObject({
    status: 400,
    data: {
      error: 'unsupported_grant_type',
    },
  });
});

describe('authorization_code', () => {
  it('should handle a missing referer header', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'app:123',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost',
        scope: 'openid',
      }),
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_request',
      },
    });
  });

  it('should fail if the referer doesn’t match the redirect URI', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'app:42',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://fooz.baz.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_request',
      },
    });
  });

  it('should fail if the client id doesn’t match an app id', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'invalid',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should fail if no authorization code has been registered', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: 'app:42',
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should not allow expired authorization codes', async () => {
    await user.$create('Organization', { id: 'org' });
    const app = await App.create({
      OrganizationId: 'org',
      definition: '',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const expires = new Date('1999-12-31T23:00:00Z');
    const authCode = await OAuth2AuthorizationCode.create({
      AppId: app.id,
      code: '123',
      UserId: user.id,
      expires,
      redirectUri: 'http://foo.bar.localhost:9999/',
      scope: 'openid',
    });
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: `app:${app.id}`,
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_grant',
      },
    });
    await expect(authCode.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should only allow granted scopes', async () => {
    await user.$create('Organization', { id: 'org' });
    const app = await App.create({
      OrganizationId: 'org',
      definition: '',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const expires = new Date('2000-01-01T00:10:00Z');
    await OAuth2AuthorizationCode.create({
      AppId: app.id,
      code: '123',
      UserId: user.id,
      expires,
      redirectUri: 'http://foo.bar.localhost:9999/',
      scope: 'openid',
    });
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        client_id: `app:${app.id}`,
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'email openid',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_scope',
      },
    });
  });

  it('should return an access token response if the authorization code is valid', async () => {
    await user.$create('Organization', { id: 'org' });
    const app = await App.create({
      OrganizationId: 'org',
      definition: '',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const expires = new Date('2000-01-01T00:10:00Z');
    const authCode = await OAuth2AuthorizationCode.create({
      AppId: app.id,
      code: '123',
      UserId: user.id,
      expires,
      redirectUri: 'http://foo.bar.localhost:9999/',
      scope: 'email openid',
    });
    const response = await request.post<TokenResponse>(
      '/oauth2/token',
      new URLSearchParams({
        client_id: `app:${app.id}`,
        code: '123',
        grant_type: 'authorization_code',
        redirect_uri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      }),
      { headers: { referer: 'http://foo.bar.localhost:9999/' } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(/(?:[\w-]+\.){2}[\w-]/),
        expires_in: 3600,
        refresh_token: expect.stringMatching(/(?:[\w-]+\.){2}[\w-]/),
        token_type: 'bearer',
      },
    });
    await expect(authCode.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
    const payload = decode(response.data.access_token);
    expect(payload).toStrictEqual({
      aud: 'app:1',
      exp: 946_688_400,
      iat: 946_684_800,
      iss: 'http://localhost',
      scope: 'openid',
      sub: user.id,
    });
  });
});

describe('client_credentials', () => {
  beforeEach(async () => {
    await OAuth2ClientCredentials.create({
      description: 'Test credentials',
      id: 'testClientId',
      expires: new Date('2000-01-02T00:00:00Z'),
      scopes: 'apps:write blocks:write',
      secret: await hash('testClientSecret', 10),
      UserId: user.id,
    });
  });

  it('should handle a missing authorization header', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials');
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle invalid authentication types', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        authorization: 'Bearer foo',
      },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle invalidly encoded basic authentication', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        authorization: 'Basic invalid',
      },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle invalid client credentials', async () => {
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: { authorization: basicAuth('invalidId', 'invalidSecret') },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_client',
      },
    });
  });

  it('should handle expired clients', async () => {
    clock.setSystemTime(new Date('2000-03-01T00:00:00Z'));
    const response = await request.post('/oauth2/token', 'grant_type=client_credentials', {
      headers: { authorization: basicAuth('testClientId', 'testClientSecret') },
    });
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_grant',
      },
    });
  });

  it('should handle unauthorized client scopes', async () => {
    const response = await request.post(
      '/oauth2/token',
      'grant_type=client_credentials&scope=blocks:write organizations:write',
      { headers: { authorization: basicAuth('testClientId', 'testClientSecret') } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_scope',
      },
    });
  });

  it('should return an access token response if the request is made correctly', async () => {
    const response = await request.post<TokenResponse>(
      '/oauth2/token',
      'grant_type=client_credentials&scope=blocks:write',
      { headers: { authorization: basicAuth('testClientId', 'testClientSecret') } },
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(/^(?:[\w-]+\.){2}[\w-]+$/),
        expires_in: 3600,
        token_type: 'bearer',
      },
    });
    const payload = decode(response.data.access_token);
    expect(payload).toStrictEqual({
      aud: 'testClientId',
      exp: 946_688_400,
      iat: 946_684_800,
      iss: 'http://localhost',
      scope: 'blocks:write',
      sub: user.id,
    });
  });
});

describe('refresh_token', () => {
  it('should verify the refresh token', async () => {
    const response = await request.post(
      '/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'invalid.refresh.token',
        scope: 'resources:manage',
      }),
    );
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_grant',
      },
    });
  });

  it('should create a refresh token', async () => {
    const response = await request.post<TokenResponse>(
      '/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: createJWTResponse(user.id).refresh_token,
        scope: 'resources:manage',
      }),
    );
    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(/^(?:[\w-]+\.){2}[\w-]+$/),
        expires_in: 3600,
        refresh_token: expect.stringMatching(/^(?:[\w-]+\.){2}[\w-]+$/),
        token_type: 'bearer',
      },
    });
    const payload = decode(response.data.access_token);
    expect(payload).toStrictEqual({
      aud: 'http://localhost',
      exp: 946_688_400,
      iat: 946_684_800,
      iss: 'http://localhost',
      sub: user.id,
    });
  });
});
