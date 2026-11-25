import { randomUUID } from 'node:crypto';

import { basicAuth, logger } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { authenticator } from 'otplib';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type App,
  type AppMember,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { encrypt } from '../../../../utils/crypto.js';
import {
  authorizeAppMember,
  authorizeStudio,
  createTestAppMember,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { createDefaultAppWithSecurity } from '../../../../utils/test/defaultAppSecurity.js';

const loginAuthorization = {
  headers: { authorization: basicAuth('test@example.com', 'testpassword') },
};

let server: Koa;
let organization: Organization;
let user: User;
let app: App;
let appMember: AppMember;
let oldSecret: string;

describe('resetAppMemberTotp', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
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
      role: PredefinedOrganizationRole.AppMemberManager,
    });
    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
    await BlockVersion.create({
      name: 'test',
      version: '0.0.0',
      OrganizationId: 'appsemble',
      parameters: { properties: { type: 'object', foo: { type: 'number' } } },
    });

    app = await createDefaultAppWithSecurity(organization);
    await app.update({ totp: 'enabled' });
    oldSecret = authenticator.generateSecret();
    appMember = await createTestAppMember(app.id);
    await appMember.update({
      totpSecret: encrypt(oldSecret, 'test'),
      totpEnabled: true,
      totpLastCounter: 0,
      userId: user.id,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should let the app member log in with their password only on apps where TOTP is enabled', async () => {
    authorizeStudio();

    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);
    expect(response.status).toBe(204);

    const login = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      loginAuthorization,
    );
    expect(login).toMatchObject({
      status: 200,
      data: { access_token: expect.stringMatching(jwtPattern) },
    });
  });

  it('should make the app member enroll again with a new authenticator on apps which require TOTP', async () => {
    await app.update({ totp: 'required' });
    authorizeStudio();

    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);
    expect(response.status).toBe(204);

    const login = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      loginAuthorization,
    );
    expect(login).toMatchObject({
      status: 401,
      data: { data: { totpRequired: true, totpEnabled: false } },
    });

    const { totpToken } = login.data.data;
    const setup = await request.post(`/api/apps/${app.id}/auth/totp/setup`, { totpToken });
    expect(setup.status).toBe(200);

    const oldCode = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: authenticator.generate(oldSecret),
      totpToken,
    });
    expect(oldCode.status).toBe(400);

    const newCode = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: authenticator.generate(setup.data.secret),
      totpToken,
    });
    expect(newCode).toMatchObject({
      status: 200,
      data: { access_token: expect.stringMatching(jwtPattern) },
    });
  });

  it('should let a locked out app member enroll again straight away', async () => {
    await app.update({ totp: 'required' });
    await appMember.update({ totpFailedAttempts: 5, totpLockedUntil: new Date(15 * 60 * 1000) });
    authorizeStudio();

    await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    const login = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      loginAuthorization,
    );
    const { totpToken } = login.data.data;
    const setup = await request.post(`/api/apps/${app.id}/auth/totp/setup`, { totpToken });
    const verify = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: authenticator.generate(setup.data.secret),
      totpToken,
    });

    expect(verify.status).toBe(200);
  });

  it('should not let a login token spent before the reset interfere with enrolling again', async () => {
    await app.update({ totp: 'required' });
    const login = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      loginAuthorization,
    );
    const { totpToken } = login.data.data;
    vi.setSystemTime(30_000);
    const verify = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(oldSecret),
      totpToken,
    });
    expect(verify.status).toBe(200);
    authorizeStudio();

    await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    const newLogin = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      loginAuthorization,
    );
    const { totpToken: newTotpToken } = newLogin.data.data;
    const setup = await request.post(`/api/apps/${app.id}/auth/totp/setup`, {
      totpToken: newTotpToken,
    });

    const spentSetup = await request.post(`/api/apps/${app.id}/auth/totp/setup`, { totpToken });
    expect(spentSetup.status).toBe(401);

    const verifySetup = await request.post(`/api/apps/${app.id}/auth/totp/verify-setup`, {
      token: authenticator.generate(setup.data.secret),
      totpToken: newTotpToken,
    });
    expect(verifySetup.status).toBe(200);
  });

  it('should keep the properties of the app member', async () => {
    await appMember.update({ properties: { employee: 'E42' } });
    authorizeStudio();

    await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    await appMember.reload();
    expect(appMember.properties).toStrictEqual({ employee: 'E42' });
  });

  it('should sign the app member out', async () => {
    const login = await request.post(
      `/api/apps/${app.id}/auth/email/login`,
      {},
      loginAuthorization,
    );
    vi.setSystemTime(30_000);
    const verify = await request.post(`/api/apps/${app.id}/auth/totp/verify`, {
      token: authenticator.generate(oldSecret),
      totpToken: login.data.data.totpToken,
    });
    expect(verify.status).toBe(200);
    authorizeStudio();

    await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    const refresh = await request.post(
      `/apps/${app.id}/auth/oauth2/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: verify.data.refresh_token,
      }),
    );
    expect(refresh).toMatchObject({ status: 400, data: { error: 'invalid_grant' } });
  });

  it('should email the app member', async () => {
    vi.spyOn(server.context.mailer, 'sendEmail');
    authorizeStudio();

    await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    await vi.waitFor(() =>
      expect(server.context.mailer.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.stringContaining('test@example.com'),
          subject: 'Two-factor authentication reset',
        }),
      ),
    );
  });

  it('should reset the TOTP of an app member only once when reset twice at the same time', async () => {
    vi.spyOn(server.context.mailer, 'sendEmail');
    authorizeStudio();

    const responses = await Promise.all([
      request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`),
      request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`),
    ]);

    expect(responses.map(({ status }) => status).sort()).toStrictEqual([204, 400]);
    await vi.waitFor(() =>
      expect(server.context.mailer.sendEmail).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ subject: 'Two-factor authentication reset' }),
      ),
    );
  });

  it('should log who reset the TOTP of which app member', async () => {
    vi.spyOn(logger, 'verbose');
    authorizeStudio();

    await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    expect(logger.verbose).toHaveBeenCalledWith(
      `Organization member Test User (${user.id}) reset the TOTP of app member ${appMember.id} of app ${app.id}`,
    );
  });

  it('should forbid organization members without the permission', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );
    authorizeStudio();

    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    expect(response.status).toBe(403);
    await appMember.reload();
    expect(appMember.totpEnabled).toBe(true);
  });

  it('should forbid members of another organization', async () => {
    const otherUser = await createTestUser('other@example.com');
    await Organization.create({ id: 'other', name: 'Other' });
    await OrganizationMember.create({
      OrganizationId: 'other',
      UserId: otherUser.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio(otherUser);

    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    expect(response.status).toBe(403);
    await appMember.reload();
    expect(appMember.totpEnabled).toBe(true);
  });

  it('should not let app members reset TOTP', async () => {
    authorizeAppMember(app, appMember);

    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    expect(response.status).toBe(401);
    await appMember.reload();
    expect(appMember.totpEnabled).toBe(true);
  });

  it('should return 404 for an unknown app', async () => {
    authorizeStudio();

    const response = await request.delete(`/api/apps/0/app-members/${appMember.id}/totp`);

    expect(response.status).toBe(404);
  });

  it('should return 404 for an unknown app member', async () => {
    authorizeStudio();

    const response = await request.delete(`/api/apps/${app.id}/app-members/${randomUUID()}/totp`);

    expect(response.status).toBe(404);
  });

  it('should return 400 if the app member has no TOTP', async () => {
    await appMember.update({ totpEnabled: false, totpSecret: null });
    authorizeStudio();

    const response = await request.delete(`/api/apps/${app.id}/app-members/${appMember.id}/totp`);

    expect(response.status).toBe(400);
  });
});
