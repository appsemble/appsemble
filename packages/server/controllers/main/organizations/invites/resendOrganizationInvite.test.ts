import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  Organization,
  OrganizationInvite,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let server: Koa;
let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  vi.useFakeTimers();
  setArgv({ host: 'http://localhost', secret: 'test' });
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
    icon: await readFixture('nodejs-logo.png'),
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
  vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
});

describe('resendOrganizationInvite', () => {
  it('should resend an invitation', async () => {
    const orgUser = await User.create({
      email: 'test2@example.com',
      timezone: 'Europe/Amsterdam',
      locale: 'nl',
      name: 'Test User',
    });

    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'invitekey',
      role: 'Member',
      OrganizationId: 'testorganization',
      UserId: orgUser.id,
    });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites/resend', {
      email: 'test2@example.com',
    });

    expect(response).toMatchObject({ status: 204 });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'organizationInvite',
      locale: 'nl',
      to: {
        email: 'test2@example.com',
        name: 'Test User',
      },
      values: {
        appName: 'null',
        link: expect.any(Function),
        name: 'Test User',
        organization: 'testorganization',
      },
    });
  });

  it('should not resend an invitation if the user does not have the right permissions', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.AppTranslator },
      { where: { UserId: user.id } },
    );
    const userB = await User.create({
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({
      UserId: userB.id,
      email: 'test2@example.com',
      verified: true,
    });

    authorizeStudio();
    await request.post('/api/organizations/testorganization/invites', {
      email: 'test2@example.com',
    });

    const response = await request.post('/api/organizations/testorganization/invites/resend', {
      email: 'test2@example.com',
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient organization permissions.',
        statusCode: 403,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should not resend an invitation to a member who has not been invited', async () => {
    const userB = await User.create({
      primaryEmail: 'test2@example.com',
      name: 'John',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({
      UserId: userB.id,
      email: 'test2@example.com',
      verified: true,
    });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites/resend', {
      email: 'test2@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'This person was not invited previously.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should not resend an invitation for a non-existent organization', async () => {
    authorizeStudio();
    const response = await request.post('/api/organizations/foo/invites/resend', {
      email: 'test2@example.com',
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Organization not found.',
        statusCode: 404,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });
});
