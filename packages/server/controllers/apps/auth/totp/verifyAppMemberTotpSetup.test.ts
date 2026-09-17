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
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { createTotpPendingToken } from '../../../../utils/totpPendingToken.js';

let organization: Organization;
let user: User;
let app: App;

describe('verifyAppMemberTotpSetup', () => {
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
      definition: {
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
      },
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

  it('should return 401 if user is not authenticated and no pending token is provided', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: '123456',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "User is not authenticated",
        "statusCode": 401,
      }
    `);
  });

  it('should reject an unauthenticated request on an app which requires TOTP', async () => {
    await app.update({ totp: 'required' });
    await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: '123456',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "User is not authenticated",
        "statusCode": 401,
      }
    `);
  });

  it('should reject an invalid pending TOTP token', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
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

  it('should return 400 if TOTP is disabled for the app', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpSecret: encrypt(secret, 'test') });
    authorizeAppMember(app, appMember);
    await app.update({ totp: 'disabled' });

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: authenticator.generate(secret),
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

  it('should return 400 if TOTP setup was not initiated', async () => {
    const appMember = await createTestAppMember(app.id);
    authorizeAppMember(app, appMember);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: '123456',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "TOTP setup not initiated",
        "statusCode": 400,
      }
    `);
  });

  it('should return 400 if TOTP is already enabled', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: encrypt(secret, 'test') });
    authorizeAppMember(app, appMember);

    const token = authenticator.generate(secret);
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "TOTP is already enabled",
        "statusCode": 400,
      }
    `);
  });

  it('should return 400 if token is invalid', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpSecret: encrypt(secret, 'test') });
    authorizeAppMember(app, appMember);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: '000000',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Invalid TOTP token",
        "statusCode": 400,
      }
    `);
  });

  it('should enable TOTP when token is valid', async () => {
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    const { AppMember } = await getAppDB(app.id);
    await appMember.update({ totpSecret: encrypt(secret, 'test') });
    authorizeAppMember(app, appMember);

    const token = authenticator.generate(secret);
    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token,
    });

    expect(response.status).toBe(204);

    // Verify TOTP is now enabled
    const updatedMember = await AppMember.findByPk(appMember.id);
    expect(updatedMember?.totpEnabled).toBe(true);
  });

  it('should complete the login when enrolling with a pending TOTP token', async () => {
    await app.update({ totp: 'required' });
    const secret = authenticator.generateSecret();
    const appMember = await createTestAppMember(app.id);
    const { AppMember } = await getAppDB(app.id);
    await appMember.update({ totpSecret: encrypt(secret, 'test') });

    const response = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: authenticator.generate(secret),
      totpToken: createTotpPendingToken({
        aud: `app:${app.id}`,
        scope: appOAuth2Scope,
        sub: appMember.id,
      }),
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

    const updatedMember = await AppMember.findByPk(appMember.id);
    expect(updatedMember?.totpEnabled).toBe(true);
    // The code is consumed, so it can’t be replayed against /auth/totp/verify.
    expect(updatedMember?.totpLastCounter).toBe(0);
  });
});
