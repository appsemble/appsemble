import { basicAuth } from '@appsemble/node-utils';
import { type OrganizationSsoConfiguration } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { type AxiosResponse } from 'axios';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { applyOrganizationSsoConfiguration } from '../../../../utils/organizationSso.js';
import { createTestUser } from '../../../../utils/test/authorization.js';

let user: User;

function login(email: string): Promise<AxiosResponse> {
  return request.post('/api/auth/email/login', undefined, {
    headers: { authorization: basicAuth(email, 'testpassword') },
  });
}

describe('loginUserWithEmail', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test-encryption' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should log in with a verified email', async () => {
    const response = await login('test@example.com');

    expect(response).toMatchObject({
      status: 200,
      data: { access_token: expect.stringMatching(jwtPattern) },
    });
  });

  it('should log in with an unverified email', async () => {
    await EmailAuthorization.create({ UserId: user.id, email: 'unverified@example.com' });

    const response = await login('unverified@example.com');

    expect(response).toMatchObject({
      status: 200,
      data: { access_token: expect.stringMatching(jwtPattern) },
    });
  });

  it('should refuse an unknown email', async () => {
    const response = await login('unknown@example.com');

    expect(response.status).toBe(401);
  });

  it('refreshes a password session without renewing interactive authentication', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    await Organization.create({ id: 'staff' });
    await OrganizationMember.create({ OrganizationId: 'staff', UserId: user.id, role: 'Owner' });
    const configuration: OrganizationSsoConfiguration = {
      issuer: 'https://identity.example.com',
      clientId: 'studio',
      clientSecret: 'secret',
      name: 'Staff',
      scope: 'openid email profile',
      groupClaim: 'groups',
      roleMappings: [],
      policy: 'optional',
      allowedLoginMethods: ['password'],
    };
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    const session = await login('test@example.com');
    vi.advanceTimersByTime(7_200_000);
    const refreshed = await request.post('/api/auth/refresh-token', {
      refresh_token: session.data.refresh_token,
    });
    expect(refreshed.headers).toMatchObject({ 'cache-control': 'no-store', pragma: 'no-cache' });
    const headers = { authorization: `Bearer ${refreshed.data.access_token}` };
    const profile = await request.get('/api/users/current', { headers });
    const members = await request.get('/api/organizations/staff/members', { headers });
    const settings = await request.put('/api/organizations/staff/sso', configuration, { headers });
    expect({
      refresh: refreshed.status,
      user: profile.data.sub,
      members: members.status,
      settings: settings.status,
      message: settings.data.message,
    }).toStrictEqual({
      refresh: 200,
      user: user.id,
      members: 200,
      settings: 403,
      message: 'Sign in again before changing single sign-on settings.',
    });
  });
});
