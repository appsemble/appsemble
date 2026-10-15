import { PredefinedOrganizationRole } from '@appsemble/types';
import { appOAuth2Scope, jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
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

  it('should reject a pending TOTP token issued by another host', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: jwt.sign(
        {
          aud: `app:${app.id}`,
          iss: 'http://other.example',
          sub: appMember.id,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_use: 'totp_pending',
        },
        'test',
        { expiresIn: 300 },
      ),
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

    // A pending token is single use, so the replay needs one issued after the first login.
    vi.setSystemTime(1000);
    const replay = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token,
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(replay).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "TOTP token already used",
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

  it('should reject codes sent in parallel using the same counter', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    const token = authenticator.generate(secret);

    const responses = await Promise.all(
      Array.from({ length: 2 }, () =>
        request.post(`/api/apps/${app.id}/auth/totp/verify`, {
          token,
          totpToken: pendingToken(app.id, appMember.id),
        }),
      ),
    );

    // Whichever request gets there first consumes the counter, the other one is a replay.
    expect(responses.filter(({ status }) => status === 200)).toHaveLength(1);
    expect(responses.filter(({ status }) => status === 401)).toHaveLength(1);
  });

  it('should lock the app member out after too many invalid codes sent in parallel', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.post(`/api/apps/${app.id}/auth/totp/verify`, {
          token: '000000',
          totpToken: pendingToken(app.id, appMember.id),
        }),
      ),
    );
    expect(responses.map(({ status }) => status)).toStrictEqual([401, 401, 401, 401, 401]);

    const { AppMember } = await getAppDB(app.id);
    const updatedMember = await AppMember.findByPk(appMember.id);
    expect(updatedMember?.totpFailedAttempts).toBe(5);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(response.status).toBe(429);
  });

  it('should count from zero again once the lockout has passed', async () => {
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

    // 15 minutes and a bit, so the lockout has passed.
    vi.setSystemTime(15 * 60 * 1000 + 1000);

    const invalid = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: '000000',
      totpToken: pendingToken(app.id, appMember.id),
    });
    expect(invalid.status).toBe(401);

    const { AppMember } = await getAppDB(app.id);
    const updatedMember = await AppMember.findByPk(appMember.id);
    // The bad code counts as the first of a new series instead of locking the app member out again.
    expect(updatedMember?.totpFailedAttempts).toBe(1);
    expect(updatedMember?.totpLockedUntil).toBeNull();

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });
    expect(response.status).toBe(200);
  });

  it('should reject a pending TOTP token which has already been used', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    const totpToken = pendingToken(app.id, appMember.id);

    const first = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken,
    });
    expect(first.status).toBe(200);

    // A fresh code, so only the spent pending token can reject this request.
    vi.setSystemTime(30 * 1000);
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Pending TOTP token has already been used",
        "statusCode": 401,
      }
    `);
  });

  it('should reject a pending TOTP token issued before a newer one was spent', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    const older = pendingToken(app.id, appMember.id);

    vi.setSystemTime(1000);
    const newer = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });
    expect(newer.status).toBe(200);

    // A fresh code, so only the older pending token can reject this request.
    vi.setSystemTime(30 * 1000);
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: older,
    });

    expect(response).toMatchObject({
      status: 401,
      data: { message: 'Pending TOTP token has already been used' },
    });
  });

  it('should accept a pending TOTP token issued right after a verification', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    const first = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken: pendingToken(app.id, appMember.id),
    });
    expect(first.status).toBe(200);

    // A second login started 100 milliseconds later. Its pending token is a different token, so
    // the single use check must not confuse it with the one just spent.
    vi.setSystemTime(100);
    const totpToken = pendingToken(app.id, appMember.id);

    // A fresh code, so only the pending token is under test here.
    vi.setSystemTime(30 * 1000);
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(secret),
      totpToken,
    });

    expect(response.status).toBe(200);
  });

  it('should reject a replay across a time step boundary', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });

    // The code for the step starting at 0, which otplib still accepts at 30001 because of its one
    // step window. Both requests must resolve it to the same counter, or the second one replays it.
    vi.setSystemTime(29_999);
    const token = authenticator.generate(secret);

    const first = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token,
      totpToken: pendingToken(app.id, appMember.id),
    });
    expect(first.status).toBe(200);

    const { AppMember } = await getAppDB(app.id);
    expect((await AppMember.findByPk(appMember.id))?.totpLastCounter).toBe(0);

    vi.setSystemTime(30_001);
    const replay = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token,
      totpToken: pendingToken(app.id, appMember.id),
    });

    expect(replay).toMatchObject({
      status: 401,
      data: { message: 'TOTP token already used' },
    });
    expect((await AppMember.findByPk(appMember.id))?.totpLastCounter).toBe(0);
  });

  it('should record the lockout together with the attempt which causes it', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    const { AppMember } = await getAppDB(app.id);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
        token: '000000',
        totpToken: pendingToken(app.id, appMember.id),
      });
      expect(response.status).toBe(401);

      const updatedMember = await AppMember.findByPk(appMember.id);
      expect(updatedMember?.totpFailedAttempts).toBe(attempt);
      // The lockout is part of the same statement as the increment, so it is never observable to
      // be at the limit without one.
      expect(updatedMember?.totpLockedUntil).toStrictEqual(
        attempt < 5 ? null : new Date(15 * 60 * 1000),
      );
    }
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
