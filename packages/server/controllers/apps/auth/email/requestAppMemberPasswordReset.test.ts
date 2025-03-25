import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AppMember,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';
import { createDefaultAppWithSecurity } from '../../../../utils/test/defaultAppSecurity.js';

let organization: Organization;
let user: User;

describe('requestAppMemberPasswordReset', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
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
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should create a password reset token', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    await request.post(`/api/apps/${app.id}/auth/email/register`, createFormData(data));

    const responseA = await request.post(`/api/apps/${app.id}/auth/email/request-password-reset`, {
      email: data.email,
    });

    const m = await AppMember.findOne({ where: { email: data.email, AppId: app.id } });
    const responseB = await request.post(`/api/apps/${app.id}/auth/email/reset-password`, {
      token: m.resetKey,
      password: 'newPassword',
    });

    await m.reload();

    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(await compare('newPassword', m.password)).toBe(true);
    expect(m.resetKey).toBeNull();
  });

  it('should not reveal existing emails', async () => {
    const app = await createDefaultAppWithSecurity(organization);

    const response = await request.post(`/api/apps/${app.id}/auth/email/request-password-reset`, {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should reset the password for the right AppMember in case of one email being used in multiple apps', async () => {
    const appA = await createDefaultAppWithSecurity(organization);
    const appB = await createDefaultAppWithSecurity(organization, { name: 'Test App 2' });

    const data = {
      email: 'shared@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    };
    await request.post(`/api/apps/${appA.id}/auth/email/register`, createFormData(data));
    await request.post(`/api/apps/${appB.id}/auth/email/register`, createFormData(data));

    // Test resetting password for the first app/member created (appA)
    let responseA = await request.post(`/api/apps/${appA.id}/auth/email/request-password-reset`, {
      email: data.email,
    });

    let memberA = await AppMember.findOne({ where: { email: data.email, AppId: appA.id } });
    let memberB = await AppMember.findOne({ where: { email: data.email, AppId: appB.id } });

    // Assert resetKey is generated for appA and not for appB
    expect(memberA.resetKey).not.toBeNull();
    expect(memberB.resetKey).toBeNull();

    // Reset password for appA
    let responseB = await request.post(`/api/apps/${appA.id}/auth/email/reset-password`, {
      token: memberA.resetKey,
      password: 'newPasswordA',
    });

    await memberA.reload();
    await memberB.reload();

    // Assert password reset for appA
    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(await compare('newPasswordA', memberA.password)).toBe(true);
    expect(memberA.resetKey).toBeNull();

    // Assert no changes for appB
    expect(await compare('password', memberB.password)).toBe(true);
    expect(memberB.resetKey).toBeNull();

    // We test for both members in the same test to ensure that
    // the order of member creation does not affect the app for which the password is reset
    // Test resetting password for the last app/member created (appB)
    responseA = await request.post(`/api/apps/${appB.id}/auth/email/request-password-reset`, {
      email: data.email,
    });

    memberA = await AppMember.findOne({ where: { email: data.email, AppId: appA.id } });
    memberB = await AppMember.findOne({ where: { email: data.email, AppId: appB.id } });

    // Assert resetKey is generated for appB and not for appA
    expect(memberB.resetKey).not.toBeNull();
    expect(memberA.resetKey).toBeNull();

    // Reset password for appB
    responseB = await request.post(`/api/apps/${appB.id}/auth/email/reset-password`, {
      token: memberB.resetKey,
      password: 'newPasswordB',
    });

    await memberA.reload();
    await memberB.reload();

    // Assert password reset for appB
    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(await compare('newPasswordB', memberB.password)).toBe(true);
    expect(memberB.resetKey).toBeNull();

    // Assert no changes for appA
    expect(await compare('newPasswordA', memberA.password)).toBe(true);
    expect(memberA.resetKey).toBeNull();
  });
});
