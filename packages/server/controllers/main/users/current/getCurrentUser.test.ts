import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
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

describe('getCurrentUser', () => {
  it('should return a user profile', async () => {
    authorizeStudio();
    const response = await request.get('/api/users/current');

    expect(response).toMatchObject({
      status: 200,
      data: {
        sub: expect.stringMatching(uuid4Pattern),
        name: 'Test User',
        email: 'test@example.com',
        email_verified: true,
        picture: 'https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=128&d=mp',
        locale: null,
        zoneinfo: 'Europe/Amsterdam',
        subscribed: true,
      },
    });
  });

  it('should not return a user profile if not logged in', async () => {
    const response = await request.get('/api/users/current');
    expect(response).toMatchObject({ status: 401 });
  });
});
