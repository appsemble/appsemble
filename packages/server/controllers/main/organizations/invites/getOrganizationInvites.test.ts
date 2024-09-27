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
});

describe('getOrganizationInvites', () => {
  it('should fetch organization invites', async () => {
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
      OrganizationId: 'testorganization',
    });

    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization/invites');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          email: 'test2@example.com',
        },
      ],
    });
  });

  it('should return forbidden if the user is a member but does not have invite permissions', async () => {
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
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
      OrganizationId: 'testorganization',
    });

    authorizeStudio();
    const response = await request.get('/api/organizations/testorganization/invites');

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient organization permissions.',
      },
    });
  });
});
