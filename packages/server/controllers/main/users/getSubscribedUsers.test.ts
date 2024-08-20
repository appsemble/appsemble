import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  User,
} from '../../../models/index.js';
import { argv, setArgv, updateArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

let user: User;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  vi.useFakeTimers();
  user = await createTestUser();
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
});

describe('getSubscribedUsers', () => {
  beforeEach(() => {
    updateArgv({ adminApiSecret: 'testAdminAPIsecret' });
  });

  it('should return a list of subscribed users', async () => {
    const user2 = await createTestUser('user2@example.com');

    const response = await request.get('/api/users/subscribed', {
      headers: { authorization: `Bearer ${argv.adminApiSecret}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(response.data).toStrictEqual([
      {
        email: user.primaryEmail,
        name: user.name,
        locale: user.locale,
      },
      {
        email: user2.primaryEmail,
        name: user2.name,
        locale: user2.locale,
      },
    ]);
  });

  it('should not get deleted users who are subscribed', async () => {
    const deletedUser = await User.create({
      deleted: new Date(),
      password: null,
      name: 'Test User',
      primaryEmail: 'deleted@example.com',
      timezone: 'Europe/Amsterdam',
      // Should not be required but just in case to be explicit
      subscribed: true,
    });
    deletedUser.EmailAuthorizations = [
      await EmailAuthorization.create({
        UserId: deletedUser.id,
        email: 'deleted@example.com',
        verified: true,
      }),
    ];
    deletedUser.save();

    const response = await request.get('/api/users/subscribed', {
      headers: { authorization: `Bearer ${argv.adminApiSecret}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data).toStrictEqual([
      {
        email: user.primaryEmail,
        name: user.name,
        locale: user.locale,
      },
    ]);
  });

  it('should not subscribe SSO users', async () => {
    await User.create({
      deleted: new Date(),
      password: null,
      name: 'Test User',
      primaryEmail: 'deleted@example.com',
      timezone: 'Europe/Amsterdam',
    });

    const response = await request.get('/api/users/subscribed', {
      headers: { authorization: `Bearer ${argv.adminApiSecret}` },
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data).toStrictEqual([
      {
        email: user.primaryEmail,
        name: user.name,
        locale: user.locale,
      },
    ]);
  });

  it('should return a 401 if admin API secret is not passed', async () => {
    updateArgv({ adminApiSecret: '' });

    const response = await request.get('/api/users/subscribed');
    expect(response.status).toBe(401);
  });

  it('should return 401 if the provided admin api secret is wrong', async () => {
    const wrongSecret = `${argv.adminApiSecret} + wrong secret`;

    const response = await request.get('/api/users/subscribed', {
      headers: { authorization: `Bearer ${wrongSecret}` },
    });

    expect(response.status).toBe(401);
  });
});
