import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../../utils/test/testSchema.js';

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

describe('removeCurrentUserEmail', () => {
  it('should delete emails', async () => {
    await EmailAuthorization.create({
      email: 'test2@example.com',
      verified: true,
      UserId: user.id,
    });

    authorizeStudio();
    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({ status: 204 });

    const { data } = await request.get('/api/users/current');

    expect(data.emails).not.toContainEqual({
      email: 'test2@example.com',
      verified: true,
      primary: false,
    });
  });

  it('should not delete non-associated emails', async () => {
    authorizeStudio();
    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test2@example.com' },
    });

    expect(response).toMatchObject({
      status: 404,
      data: {
        statusCode: 404,
        error: 'Not Found',
        message: 'This email address is not associated with your account.',
      },
    });
  });

  it('should not delete the last login method', async () => {
    authorizeStudio();
    const response = await request.delete('/api/users/current/emails', {
      data: { email: 'test@example.com' },
    });

    expect(response).toMatchObject({
      status: 406,
      data: {
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'Deleting this email results in the inability to access this account.',
      },
    });
  });
});