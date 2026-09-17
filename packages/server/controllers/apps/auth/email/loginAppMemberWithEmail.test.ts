import { basicAuth } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestAppMember, createTestUser } from '../../../../utils/test/authorization.js';

const authorization = { headers: { authorization: basicAuth('test@example.com', 'testpassword') } };

let organization: Organization;
let user: User;
let app: App;

describe('loginAppMemberWithEmail', () => {
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
      totp: 'disabled',
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return tokens when the app does not use TOTP', async () => {
    const appMember = await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/email/login`, {}, authorization);

    expect(response).toMatchObject({
      status: 200,
      data: {
        access_token: expect.stringMatching(jwtPattern),
        refresh_token: expect.stringMatching(jwtPattern),
        token_type: 'bearer',
      },
    });
    // The session belongs to the app member owning the email, not to the studio user which
    // authenticated.
    expect(jwt.decode(response.data.access_token)).toMatchObject({ sub: appMember.id });
  });

  it('should refuse to log in without an app member', async () => {
    const response = await request.post(`/api/apps/${app.id}/auth/email/login`, {}, authorization);

    expect(response).toMatchObject({
      status: 401,
      data: { error: 'Unauthorized', message: 'App member not found', statusCode: 401 },
    });
  });

  it('should not challenge a member who has not opted in on an app where TOTP is optional', async () => {
    await app.update({ totp: 'enabled' });
    await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/email/login`, {}, authorization);

    expect(response.status).toBe(200);
  });

  it('should challenge a member who opted in on an app where TOTP is optional', async () => {
    await app.update({ totp: 'enabled' });
    const appMember = await createTestAppMember(app.id);
    await appMember.update({ totpEnabled: true });

    const response = await request.post(`/api/apps/${app.id}/auth/email/login`, {}, authorization);

    expect(response.status).toBe(401);
    expect(response.data).toMatchObject({
      error: 'Unauthorized',
      message: 'TOTP verification required',
      data: {
        totpRequired: true,
        totpEnabled: true,
        totpToken: expect.stringMatching(jwtPattern),
      },
    });
  });

  it('should enforce TOTP before issuing tokens', async () => {
    await app.update({ totp: 'required' });
    const appMember = await createTestAppMember(app.id);

    const response = await request.post(`/api/apps/${app.id}/auth/email/login`, {}, authorization);

    expect(response.status).toBe(401);
    expect(response.data).toMatchObject({
      error: 'Unauthorized',
      message: 'TOTP verification required',
      data: {
        totpRequired: true,
        totpEnabled: false,
        totpToken: expect.stringMatching(jwtPattern),
      },
    });
    // The pending token has to identify the app member, or the verification step can’t resolve who
    // is logging in.
    expect(jwt.decode(response.data.data.totpToken)).toMatchObject({
      aud: `app:${app.id}`,
      sub: appMember.id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_use: 'totp_pending',
    });
  });
});
