import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
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
import {
  authorizeAppMember,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { createTotpPendingToken } from '../../../../utils/totpPendingToken.js';

let organization: Organization;
let user: User;
let app: App;

describe('setupAppMemberTotp', () => {
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

  it('should return 401 if user is not authenticated', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {});

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

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {});

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
    await app.update({ totp: 'required' });
    await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {
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

  it('should accept a pending TOTP token from the first login step', async () => {
    await app.update({ totp: 'required' });
    const appMember = await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {
      totpToken: createTotpPendingToken({ aud: `app:${app.id}`, sub: appMember.id }),
    });

    expect(response.status).toBe(200);
    expect(response.data.secret).toMatch(/^[2-7A-Z]{16}$/);

    const { AppMember } = await getAppDB(app.id);
    const updatedMember = await AppMember.findByPk(appMember.id);
    expect(updatedMember?.totpSecret).not.toBeNull();
    expect(updatedMember?.totpEnabled).toBe(false);
  });

  it('should accept the same pending TOTP token more than once', async () => {
    await app.update({ totp: 'required' });
    const appMember = await createTestAppMember(app.id);
    const totpToken = createTotpPendingToken({ aud: `app:${app.id}`, sub: appMember.id });

    const first = await request.post(`/api/apps/${app.id}/auth/totp/setup`, { totpToken });
    // Restarting enrollment is not a login, so the pending token isn’t spent by it.
    const second = await request.post(`/api/apps/${app.id}/auth/totp/setup`, { totpToken });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.data.secret).not.toBe(first.data.secret);
  });

  it('should return 400 if TOTP is disabled for the app', async () => {
    await app.update({ totp: 'disabled' });
    const appMember = await createTestAppMember(app.id);
    authorizeAppMember(app, appMember);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {});

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

  it('should return 400 if TOTP is already enabled for the member', async () => {
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true, totpSecret: Buffer.from('secret') });
    authorizeAppMember(app, appMember);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {});

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

  it('should generate TOTP secret and otpauth URL', async () => {
    const appMember = await createTestAppMember(app.id);
    authorizeAppMember(app, appMember);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {});

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('secret');
    expect(response.data).toHaveProperty('otpauthUrl');
    expect(response.data.secret).toMatch(/^[2-7A-Z]{16}$/);
    expect(response.data.otpauthUrl).toContain('otpauth://totp/');
    expect(response.data.otpauthUrl).toContain(encodeURIComponent(appMember.email));

    // Verify the secret was stored in the database
    const { AppMember } = await getAppDB(app.id);
    const updatedMember = await AppMember.findByPk(appMember.id);
    expect(updatedMember?.totpSecret).not.toBeNull();
    expect(updatedMember?.totpEnabled).toBe(false);
  });

  it('should work when app totp is set to required', async () => {
    await app.update({ totp: 'required' });
    const appMember = await createTestAppMember(app.id);
    authorizeAppMember(app, appMember);

    const response = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {});

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('secret');
    expect(response.data).toHaveProperty('otpauthUrl');
  });
});
