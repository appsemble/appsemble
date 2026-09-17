import { PredefinedOrganizationRole } from '@appsemble/types';
import { appOAuth2Scope, jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { authenticator } from 'otplib';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { encrypt } from '../../../../utils/crypto.js';
import { createTestAppMember, createTestUser } from '../../../../utils/test/authorization.js';
import { createTotpPendingToken } from '../../../../utils/totpPendingToken.js';

let organization: Organization;
let user: User;
let app: App;

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Test Page',
  security: {
    default: {
      role: 'Reader',
      policy: 'everyone',
    },
    roles: {
      Reader: {},
      Admin: {},
    },
  },
} as const;

function pendingToken(appId: number, sub: string): string {
  return createTotpPendingToken({ aud: `app:${appId}`, scope: appOAuth2Scope, sub });
}

describe('verifyAppMemberTotp', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'appsemble',
      parameters: {
        properties: {
          type: 'object',
          foo: {
            type: 'number',
          },
        },
      },
    });

    app = await App.create({
      definition: appDefinition,
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      totp: 'enabled',
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should reject a request without a pending TOTP token', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: '123456',
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe('JSON schema validation failed');
  });

  it('should reject an invalid pending TOTP token', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: '123456',
      totpToken: 'not-a-token',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Invalid pending TOTP token",
        "statusCode": 401,
      }
    `);
  });

  it('should reject a pending TOTP token issued for another app', async () => {
    const otherApp = await App.create({
      definition: appDefinition,
      path: 'other-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      totp: 'enabled',
    });
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    const response = await request.post(`/api/apps/${otherApp.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Invalid pending TOTP token",
        "statusCode": 401,
      }
    `);
  });

  it('should return 400 if TOTP is disabled for the app', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    await app.update({ totp: 'disabled' });

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "TOTP is not enabled for this app",
        "statusCode": 400,
      }
    `);
  });

  it('should return 404 if app member is not found', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: '123456',
      totpToken: pendingToken(app.id, '00000000-0000-0000-0000-000000000000'),
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App member not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return 400 if TOTP is not enabled for the member', async () => {
    const appMember = await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: '123456',
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "TOTP is not enabled for this member",
        "statusCode": 400,
      }
    `);
  });

  it('should return 401 if token is invalid', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: '000000',
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Invalid TOTP token",
        "statusCode": 401,
      }
    `);
  });

  it('should reject a code which has already been used', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    const token = authenticator.generate(secret);

    const first = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token,
      totpToken: pendingToken(app.id, appMember.id),
    });
    expect(first.status).toBe(200);

    const replay = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token,
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(replay).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Invalid TOTP token",
        "statusCode": 401,
      }
    `);
  });

  it('should lock the app member out after too many invalid codes', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
        token: '000000',
        totpToken: pendingToken(app.id, appMember.id),
      });
      expect(response.status).toBe(401);
    }

    // Even the correct code is refused while the app member is locked out.
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 429 Too Many Requests
      Content-Type: application/json; charset=utf-8

      {
        "error": "Too Many Requests",
        "message": "Too many failed TOTP attempts, please try again later",
        "statusCode": 429,
      }
    `);
  });

  it('should return JWT tokens when token is valid', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    const token = authenticator.generate(secret);
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token,
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(jwtPattern),
        expires_in: 3600,
        refresh_token: expect.stringMatching(jwtPattern),
        token_type: 'bearer',
      },
    });

    const { AppMember } = await getAppDB(app.id);
    const updatedMember = await AppMember.findByPk(appMember.id);
    expect(updatedMember?.totpLastCounter).toBe(0);
    expect(updatedMember?.totpFailedAttempts).toBe(0);

    const headers = response.headers as Record<string, string[] | undefined>;
    const setCookie = headers['set-cookie'] ?? headers['Set-Cookie'];
    const attributes = '(?=.*httponly)(?=.*secure)(?=.*samesite=none)(?=.*partitioned)';

    expect(setCookie).toStrictEqual(
      expect.arrayContaining([
        expect.stringMatching(
          new RegExp(
            `^app_refresh_token=[^;]+; path=/apps/${app.id}/auth/oauth2/token; ${attributes}.*$`,
            'i',
          ),
        ),
        expect.stringMatching(
          new RegExp(
            `^app_refresh_token\\.sig=[^;]+; path=/apps/${app.id}/auth/oauth2/token; ${attributes}.*$`,
            'i',
          ),
        ),
      ]),
    );
  });
});
