import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../../models/index.js';
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
    role: 'Owner',
  });
});

describe('getOrganizationMembers', () => {
  it('should fetch organization members', async () => {
    authorizeStudio();
    const response = await request.get('/api/main/organizations/testorganization/members');

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: expect.any(String),
          name: 'Test User',
          primaryEmail: 'test@example.com',
          role: 'Owner',
        },
      ],
    });
  });

  it('should should not fetch organization members if the user is not a member', async () => {
    authorizeStudio();
    await Organization.create({ id: 'org' });
    const response = await request.get('/api/main/organizations/org/members');

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User is not part of this organization.',
      },
    });
  });
});
