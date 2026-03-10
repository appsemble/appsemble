import { basicAuth } from '@appsemble/node-utils';
import { type TokenResponse } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, OAuth2ClientCredentials, type User } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createJWTResponse } from '../../utils/createJWTResponse.js';
import { createServer } from '../../utils/createServer.js';
import { createTestAppMember, createTestUser } from '../../utils/test/authorization.js';

let user: User;

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
      await expect(authCode.reload()).rejects.toThrowError(
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
      await expect(authCode.reload()).rejects.toThrowError(
        'Instance could not be reloaded because it does not exist anymore (find call returned null)',
      );
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: 'app:1',
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
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
        scope: 'blocks:write',
        sub: user.id,
      });
    });
  });

  describe('refresh_token', () => {
    it('should verify the refresh token', async () => {
      const response = await request.post(
        'apps/1/auth/oauth2/token',
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
        'apps/1/auth/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: createJWTResponse(user.id).refresh_token!,
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
      const payload = jwt.decode(response.data.access_token);
      expect(payload).toStrictEqual({
        aud: 'http://localhost',
        exp: 946_688_400,
        iat: 946_684_800,
        iss: 'http://localhost',
        sub: user.id,
      });
    });
  });
});
