import { randomBytes } from 'node:crypto';

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

describe('createOrganizationInvites', () => {
  it('should require the InviteMember permission', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id } },
    );

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: PredefinedOrganizationRole.Member },
    ]);
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

  it('should throw a bad request of all invitees are already in the organization', async () => {
    const userA = await User.create({
      primaryEmail: 'a@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await OrganizationMember.create({ OrganizationId: organization.id, UserId: userA.id });

    const userB = await User.create({
      primaryEmail: 'b@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userB.id, email: 'b@example.com' });
    await OrganizationMember.create({ OrganizationId: organization.id, UserId: userB.id });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: PredefinedOrganizationRole.Member },
      { email: 'b@example.com', role: PredefinedOrganizationRole.Member },
    ]);
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'All invited users are already part of this organization',
        statusCode: 400,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should throw a bad request of all new invitees are have already been invited', async () => {
    const userA = await User.create({
      primaryEmail: 'a@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await OrganizationMember.create({ OrganizationId: organization.id, UserId: userA.id });

    await OrganizationInvite.create({
      OrganizationId: organization.id,
      email: 'b@example.com',
      key: randomBytes(20).toString('hex'),
    });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: PredefinedOrganizationRole.Member },
      { email: 'b@example.com', role: PredefinedOrganizationRole.Member },
    ]);
    expect(response).toMatchObject({
      status: 400,
      data: {
        error: 'Bad Request',
        message: 'All email addresses are already invited to this organization',
        statusCode: 400,
      },
    });
    expect(server.context.mailer.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should invite users by their primary email', async () => {
    const userA = await User.create({
      primaryEmail: 'a@example.com',
      timezone: 'Europe/Amsterdam',
      locale: 'nl',
      name: 'Test User',
    });
    await EmailAuthorization.create({ UserId: userA.id, email: 'a@example.com' });
    await EmailAuthorization.create({ UserId: userA.id, email: 'aa@example.com' });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'aa@example.com', role: PredefinedOrganizationRole.Member },
    ]);
    const invite = await OrganizationInvite.findOne();

    expect(response).toMatchObject({
      status: 201,
      data: [{ email: 'a@example.com', role: PredefinedOrganizationRole.Member }],
    });
    expect(invite).toMatchObject({
      email: 'a@example.com',
      key: expect.stringMatching(/^\w{40}$/),
      OrganizationId: 'testorganization',
      UserId: userA.id,
      role: PredefinedOrganizationRole.Member,
    });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'organizationInvite',
      locale: 'nl',
      to: {
        email: 'a@example.com',
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

  it('should invite unknown email addresses', async () => {
    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/invites', [
      { email: 'a@example.com', role: PredefinedOrganizationRole.Member },
    ]);
    const invite = await OrganizationInvite.findOne();

    expect(response).toMatchObject({
      status: 201,
      data: [{ email: 'a@example.com', role: PredefinedOrganizationRole.Member }],
    });
    expect(invite).toMatchObject({
      email: 'a@example.com',
      key: expect.stringMatching(/^\w{40}$/),
      OrganizationId: 'testorganization',
      UserId: null,
      role: PredefinedOrganizationRole.Member,
    });
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'organizationInvite',
      to: {
        email: 'a@example.com',
      },
      values: {
        appName: 'null',
        link: expect.any(Function),
        name: 'null',
        organization: 'testorganization',
      },
    });
  });
});
