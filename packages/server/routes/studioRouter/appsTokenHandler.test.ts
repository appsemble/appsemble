import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { basicAuth } from '@appsemble/node-utils';
import { type TokenResponse } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { type AxiosResponse } from 'axios';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppMember,
  getAppDB,
  OAuth2ClientCredentials,
  type User,
} from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createJWTResponse } from '../../utils/createJWTResponse.js';
import { createServer } from '../../utils/createServer.js';
import { createTestAppMember, createTestUser } from '../../utils/test/authorization.js';

let user: User;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getSetCookieHeaders(response: { headers: Record<string, unknown> }): string[] {
  const headers = response.headers as Record<string, string[] | string | undefined>;
  const setCookie = headers['set-cookie'] ?? headers['Set-Cookie'];
  expect(setCookie).toBeDefined();
  return Array.isArray(setCookie) ? setCookie : [setCookie!];
}

function getCookieHeader(response: { headers: Record<string, unknown> }): string {
  return getSetCookieHeaders(response)
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function expectAppAuthCookies(response: { headers: Record<string, unknown> }, appId: number): void {
  const attributes = '(?=.*httponly)(?=.*secure)(?=.*samesite=none)(?=.*partitioned)';

  expect(getSetCookieHeaders(response)).toStrictEqual(
    expect.arrayContaining([
      expect.stringMatching(
        new RegExp(
          `^app_refresh_token=[^;]+; path=/apps/${appId}/auth/oauth2/token; ${attributes}.*$`,
          'i',
        ),
      ),
      expect.stringMatching(
        new RegExp(
          `^app_refresh_token\\.sig=[^;]+; path=/apps/${appId}/auth/oauth2/token; ${attributes}.*$`,
          'i',
        ),
      ),
    ]),
  );
}

async function createStoredRefreshToken(appId: number, sub = user.id): Promise<string> {
  const token = randomBytes(72).toString('base64url');
  const { AppMemberRefreshSession } = await getAppDB(appId);

  await AppMemberRefreshSession.create({
    aud: `app:${appId}`,
    expires: new Date('2000-02-01T00:00:00Z'),
    id: randomUUID(),
    sub,
    tokenHash: hashToken(token),
  });

  return token;
}

async function createAuthorizationCodeTokenResponse(
  redirectUri = 'http://foo.bar.localhost:9999/',
): Promise<{
  app: App;
  appMember: AppMember;
  response: AxiosResponse<TokenResponse>;
}> {
  const organizationId = `org-${randomUUID()}`;
  await user.$create('Organization', { id: organizationId });
  const app = await App.create({
    OrganizationId: organizationId,
    definition: '',
    vapidPrivateKey: '',
    vapidPublicKey: '',
  });
  const appMember = await createTestAppMember(app.id);
  const code = randomUUID();
  const { OAuth2AuthorizationCode } = await getAppDB(app.id);
  await OAuth2AuthorizationCode.create({
    code,
    AppMemberId: appMember.id,
    expires: new Date('2000-01-01T00:10:00Z'),
    redirectUri,
    scope: 'email openid',
  });

  const response = await request.post<TokenResponse>(
    `/apps/${app.id}/auth/oauth2/token`,
    new URLSearchParams({
      client_id: `app:${app.id}`,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'openid',
    }),
    { headers: { referer: redirectUri } },
  );

  return { app, appMember, response };
}

describe('appsTokenHandler', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));
    user = await createTestUser();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should not accept invalid content types', async () => {
    const response = await request.post('/apps/1/auth/oauth2/token', {});
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'invalid_request',
      },
    });
  });

  it('should not accept missing grant types', async () => {
    const response = await request.post('/apps/1/auth/oauth2/token', '');
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'unsupported_grant_type',
      },
    });
  });

  it('should not accept unsupported grant types', async () => {
    const response = await request.post('/apps/1/auth/oauth2/token', 'grant_type=unsupported');
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
        '/apps/1/auth/oauth2/token',
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

    it('should accept an origin header if the referer header is missing', async () => {
      await user.$create('Organization', { id: 'org' });
      const app = await App.create({
        OrganizationId: 'org',
        definition: '',
        vapidPrivateKey: '',
        vapidPublicKey: '',
      });
      const appMember = await createTestAppMember(app.id);
      const { OAuth2AuthorizationCode } = await getAppDB(app.id);
      await OAuth2AuthorizationCode.create({
        code: 'origin-code',
        AppMemberId: appMember.id,
        expires: new Date('2000-01-01T00:10:00Z'),
        redirectUri: 'http://foo.bar.localhost:9999/Callback',
        scope: 'openid',
      });

      const response = await request.post<TokenResponse>(
        `/apps/${app.id}/auth/oauth2/token`,
        new URLSearchParams({
          client_id: `app:${app.id}`,
          code: 'origin-code',
          grant_type: 'authorization_code',
          redirect_uri: 'http://foo.bar.localhost:9999/Callback',
          scope: 'openid',
        }),
        { headers: { origin: 'http://foo.bar.localhost:9999' } },
      );

      expect(response).toMatchObject({
        status: 200,
        data: {
          access_token: expect.stringMatching(jwtPattern),
          expires_in: 3600,
          refresh_token: expect.stringMatching(jwtPattern),
          token_type: 'bearer',
        },
      });
    });

    it('should set secure app auth cookies if SSL is enabled', async () => {
      setArgv({ host: 'https://localhost', secret: 'test', ssl: true });
      try {
        const { app, response } = await createAuthorizationCodeTokenResponse(
          'https://foo.bar.localhost:9999/',
        );

        expect(response).toMatchObject({
          status: 200,
          data: {
            access_token: expect.stringMatching(jwtPattern),
            refresh_token: expect.stringMatching(jwtPattern),
          },
        });
        expectAppAuthCookies(response, app.id);
      } finally {
        setArgv({ host: 'http://localhost', secret: 'test' });
      }
    });

    it('should set secure app auth cookies if the external host is HTTPS', async () => {
      setArgv({ host: 'https://localhost', secret: 'test' });
      try {
        const { app, response } = await createAuthorizationCodeTokenResponse(
          'https://foo.bar.localhost:9999/',
        );

        expect(response).toMatchObject({
          status: 200,
          data: {
            access_token: expect.stringMatching(jwtPattern),
            refresh_token: expect.stringMatching(jwtPattern),
          },
        });
        expectAppAuthCookies(response, app.id);
      } finally {
        setArgv({ host: 'http://localhost', secret: 'test' });
      }
    });

    it('should set secure app auth cookies if the app request origin is HTTPS', async () => {
      const { app, response } = await createAuthorizationCodeTokenResponse(
        'https://foo.bar.localhost:9999/',
      );

      expect(response).toMatchObject({
        status: 200,
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      });
      expectAppAuthCookies(response, app.id);
    });

    it('should fail if the referer doesn’t match the redirect URI', async () => {
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
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
        '/apps/1/auth/oauth2/token',
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

    it('should fail if app is not found', async () => {
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
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
        status: 404,
        data: {
          error: 'Not Found',
        },
      });
    });

    it('should fail if no authorization code has been registered', async () => {
      await user.$create('Organization', { id: 'org' });
      const app = await App.create({
        OrganizationId: 'org',
        definition: '',
        vapidPrivateKey: '',
        vapidPublicKey: '',
      });
      const response = await request.post(
        `/apps/${app.id}/auth/oauth2/token`,
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
      const appMember = await createTestAppMember(app.id);
      const expires = new Date('1999-12-31T23:00:00Z');
      const { OAuth2AuthorizationCode } = await getAppDB(app.id);
      const authCode = await OAuth2AuthorizationCode.create({
        code: '123',
        AppMemberId: appMember.id,
        expires,
        redirectUri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      });
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
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
      const appMember = await createTestAppMember(app.id);
      const { OAuth2AuthorizationCode } = await getAppDB(app.id);
      await OAuth2AuthorizationCode.create({
        code: '123',
        AppMemberId: appMember.id,
        expires,
        redirectUri: 'http://foo.bar.localhost:9999/',
        scope: 'openid',
      });
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
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
      const appMember = await createTestAppMember(app.id);
      const expires = new Date('2000-01-01T00:10:00Z');
      const { OAuth2AuthorizationCode } = await getAppDB(app.id);
      const authCode = await OAuth2AuthorizationCode.create({
        code: '123',
        AppMemberId: appMember.id,
        expires,
        redirectUri: 'http://foo.bar.localhost:9999/',
        scope: 'email openid',
      });
      const response = await request.post<TokenResponse>(
        '/apps/1/auth/oauth2/token',
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
          access_token: expect.stringMatching(jwtPattern),
          expires_in: 3600,
          refresh_token: expect.stringMatching(jwtPattern),
          token_type: 'bearer',
        },
      });
      expect(response.data.access_token).not.toBe(response.data.refresh_token);
      await expect(authCode.reload()).rejects.toThrow(
        'Instance could not be reloaded because it does not exist anymore (find call returned null)',
      );
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: 'app:1',
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_use: 'access',
        scope: 'openid',
        sub: appMember.id,
      });
    });

    it('should return an access token response for apps using a custom domain', async () => {
      await user.$create('Organization', { id: 'org-custom-domain' });
      const app = await App.create({
        OrganizationId: 'org-custom-domain',
        definition: '',
        domain: 'custom.example.com',
        vapidPrivateKey: '',
        vapidPublicKey: '',
      });
      const appMember = await createTestAppMember(app.id);
      const expires = new Date('2000-01-01T00:10:00Z');
      const redirectUri = 'https://custom.example.com/callback';
      const { OAuth2AuthorizationCode } = await getAppDB(app.id);
      const authCode = await OAuth2AuthorizationCode.create({
        code: 'custom-domain-code',
        AppMemberId: appMember.id,
        expires,
        redirectUri,
        scope: 'email openid',
      });
      const response = await request.post<TokenResponse>(
        `/apps/${app.id}/auth/oauth2/token`,
        new URLSearchParams({
          client_id: `app:${app.id}`,
          code: 'custom-domain-code',
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          scope: 'openid',
        }),
        { headers: { referer: 'https://custom.example.com/login' } },
      );
      expect(response).toMatchObject({
        status: 200,
        data: {
          access_token: expect.stringMatching(jwtPattern),
          expires_in: 3600,
          refresh_token: expect.stringMatching(jwtPattern),
          token_type: 'bearer',
        },
      });
      expect(response.data.access_token).not.toBe(response.data.refresh_token);
      await expect(authCode.reload()).rejects.toThrow(
        'Instance could not be reloaded because it does not exist anymore (find call returned null)',
      );
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: `app:${app.id}`,
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_use: 'access',
        scope: 'openid',
        sub: appMember.id,
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
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
        'grant_type=client_credentials',
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_client',
        },
      });
    });

    it('should handle invalid authentication types', async () => {
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            authorization: 'Bearer foo',
          },
        },
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_client',
        },
      });
    });

    it('should handle invalidly encoded basic authentication', async () => {
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            authorization: 'Basic invalid',
          },
        },
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_client',
        },
      });
    });

    it('should handle invalid client credentials', async () => {
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: { authorization: basicAuth('invalidId', 'invalidSecret') },
        },
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_client',
        },
      });
    });

    it('should handle expired clients', async () => {
      vi.setSystemTime(new Date('2000-03-01T00:00:00Z'));
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: { authorization: basicAuth('testClientId', 'testClientSecret') },
        },
      );
      expect(response).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_grant',
        },
      });
    });

    it('should handle unauthorized client scopes', async () => {
      const response = await request.post(
        '/apps/1/auth/oauth2/token',
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
        '/apps/1/auth/oauth2/token',
        'grant_type=client_credentials&scope=blocks:write',
        { headers: { authorization: basicAuth('testClientId', 'testClientSecret') } },
      );
      expect(response).toMatchObject({
        status: 200,
        data: {
          access_token: expect.stringMatching(jwtPattern),
          expires_in: 3600,
          token_type: 'bearer',
        },
      });
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: 'testClientId',
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_use: 'access',
        scope: 'blocks:write',
        sub: user.id,
      });
    });
  });

  describe('refresh_token', () => {
    let appId: number;
    let tokenEndpoint: string;

    beforeEach(async () => {
      const organizationId = `org-${randomUUID()}`;
      await user.$create('Organization', { id: organizationId });
      const app = await App.create({
        OrganizationId: organizationId,
        definition: '',
        vapidPrivateKey: '',
        vapidPublicKey: '',
      });
      appId = app.id;
      tokenEndpoint = `apps/${appId}/auth/oauth2/token`;
    });

    it('should verify the refresh token', async () => {
      const response = await request.post(
        tokenEndpoint,
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

    it('should reject access tokens in the refresh token grant', async () => {
      const tokens = createJWTResponse(user.id, { aud: `app:${appId}` });
      const response = await request.post(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.access_token,
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

    it('should create a refresh token from the signed refresh token cookie', async () => {
      const {
        app,
        appMember,
        response: loginResponse,
      } = await createAuthorizationCodeTokenResponse();

      const response = await request.post<TokenResponse>(
        `/apps/${app.id}/auth/oauth2/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
        }),
        { headers: { cookie: getCookieHeader(loginResponse) } },
      );

      expect(response).toMatchObject({
        status: 200,
        data: {
          access_token: expect.stringMatching(jwtPattern),
          expires_in: 3600,
          refresh_token: expect.stringMatching(jwtPattern),
          token_type: 'bearer',
        },
      });
      expect(response.data.access_token).not.toBe(response.data.refresh_token);
      expectAppAuthCookies(response, app.id);
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: `app:${app.id}`,
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
        scope: 'openid',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_use: 'access',
        sub: appMember.id,
      });
    });

    it('should invalidate a refresh token after use', async () => {
      const token = await createStoredRefreshToken(appId);

      const firstResponse = await request.post(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token,
          scope: 'resources:manage',
        }),
      );
      expect(firstResponse).toMatchObject({
        status: 200,
      });

      const secondResponse = await request.post(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token,
          scope: 'resources:manage',
        }),
      );
      expect(secondResponse).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_grant',
        },
      });
    });

    it('should revoke a refresh token', async () => {
      const token = await createStoredRefreshToken(appId);

      const revokeResponse = await request.post(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'revoke_token',
          refresh_token: token,
        }),
      );
      expect(revokeResponse).toMatchObject({
        status: 200,
        data: {},
      });

      const refreshResponse = await request.post(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token,
          scope: 'resources:manage',
        }),
      );
      expect(refreshResponse).toMatchObject({
        status: 400,
        data: {
          error: 'invalid_grant',
        },
      });
    });

    it('should be idempotent when revoking invalid tokens', async () => {
      const response = await request.post(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'revoke_token',
          refresh_token: 'invalid.refresh.token',
        }),
      );
      expect(response).toMatchObject({
        status: 200,
        data: {},
      });
    });

    it('should create a refresh token', async () => {
      const response = await request.post<TokenResponse>(
        tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: await createStoredRefreshToken(appId),
          scope: 'resources:manage',
        }),
      );
      expect(response).toMatchObject({
        status: 200,
        data: {
          access_token: expect.stringMatching(jwtPattern),
          expires_in: 3600,
          refresh_token: expect.stringMatching(jwtPattern),
          token_type: 'bearer',
        },
      });
      expect(response.data.access_token).not.toBe(response.data.refresh_token);
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: `app:${appId}`,
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
        scope: 'email openid profile resources:manage groups:read groups:write',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_use: 'access',
        sub: user.id,
      });
    });
  });
});
