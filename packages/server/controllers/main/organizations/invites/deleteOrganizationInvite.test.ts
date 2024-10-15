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

let organization: Organization;
let server: Koa;
let user: User;

describe('deleteOrganizationInvite', () => {
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
    await Organization.create({
      id: 'appsemble',
      name: 'Appsemble',
    });
  });

  it('should revoke an invite', async () => {
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'invitekey',
      role: 'Member',
      OrganizationId: 'testorganization',
    });

    authorizeStudio();
    const response = await request.delete('/api/organizations/testorganization/invites', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });
  });

  it('should not revoke an invite if the user does not have the right permissions', async () => {
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'invitekey',
      role: 'Member',
      OrganizationId: 'testorganization',
    });

    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.AppTranslator },
      { where: { UserId: user.id } },
    );

    authorizeStudio();
    const response = await request.delete('/api/organizations/testorganization/invites', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient organization permissions.',
        statusCode: 403,
      },
    });
  });

  it('should not revoke a non-existent invite', async () => {
    authorizeStudio();
    const response = await request.delete('/api/organizations/testorganization/invites', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 404 });
  });

  it('should not revoke an invite for an organization you are not a member of', async () => {
    await Organization.create({ id: 'org' });
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
    await OrganizationInvite.create({
      email: 'test2@example.com',
      key: 'abcde',
      role: 'Member',
      OrganizationId: 'org',
    });
    authorizeStudio();
    const response = await request.delete('/api/organizations/org/invites', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({
      status: 403,
      data: {
        message: 'User is not a member of this organization.',
      },
    });
  });
});
