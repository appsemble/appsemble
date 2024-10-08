import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { argv, setArgv, updateArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

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

describe('unsubscribeCurrentUser', () => {
  beforeEach(() => {
    updateArgv({ adminApiSecret: 'testAdminAPIsecret' });
  });

  it('should unsubscribe a user already subscribed to the newsletter', async () => {
    const response = await request.post(
      '/api/users/current/unsubscribe',
      { email: user.primaryEmail },
      {
        headers: { authorization: `Bearer ${argv.adminApiSecret}` },
      },
    );

    expect(response.status).toBe(201);
    expect(response.data).toContain(user.primaryEmail);
  });

  it('should return 304 if the user is not subscribed', async () => {
    const user2 = await User.create({
      password: await hash('password', 10),
      name: 'Test User 2',
      primaryEmail: 'test2@example.com',
      subscribed: false,
      timezone: 'Europe/Amsterdam',
    });
    user2.EmailAuthorizations = [
      await EmailAuthorization.create({
        UserId: user2.id,
        email: 'test2@example.com',
        verified: true,
      }),
    ];
    const response = await request.post(
      '/api/users/current/unsubscribe',
      { email: user2.primaryEmail },
      {
        headers: { authorization: `Bearer ${argv.adminApiSecret}` },
      },
    );
    expect(response.status).toBe(422);
    expect(response.data).toBe("User wasn't subscribed");
  });

  it('should return 404 if user to unsubscribe does not exist', async () => {
    const response = await request.post(
      '/api/users/current/unsubscribe',
      { email: 'test@bot.com' },
      {
        headers: { authorization: `Bearer ${argv.adminApiSecret}` },
      },
    );
    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'User does not exist',
      },
    });
  });

  it('should return 401 if the admin api secret is missing', async () => {
    // Unsetting the secret should result in 401 regardless of whether the correct secret is passed
    const secret = argv.adminApiSecret;
    updateArgv({ adminApiSecret: '' });

    const response = await request.post(
      '/api/users/current/unsubscribe',
      { email: user.primaryEmail },
      {
        headers: { authorization: `Bearer ${secret}` },
      },
    );

    expect(response.status).toBe(401);
  });

  it('should return 401 if the provided admin api secret is wrong', async () => {
    const wrongSecret = `${argv.adminApiSecret} + wrong secret`;

    const response = await request.post(
      '/api/users/current/unsubscribe',
      { email: user.primaryEmail },
      {
        headers: { authorization: `Bearer ${wrongSecret}` },
      },
    );

    expect(response.status).toBe(401);
  });

  it('should return 400 if the provided email does not match an existing user', async () => {
    const wrongEmail = 'wrongTestEmail';
    const response = await request.post(
      '/api/users/current/unsubscribe',
      { email: wrongEmail },
      {
        headers: { authorization: `Bearer ${argv.adminApiSecret}` },
      },
    );

    expect(response.status).toBe(400);
  });
});
