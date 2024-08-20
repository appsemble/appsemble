import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../../../models/index.js';
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

describe('getCurrentUserOrganizations', () => {
  it('should fetch all user organizations', async () => {
    const organizationB = await Organization.create({ id: 'testorganizationb' });
    await OrganizationMember.create({ OrganizationId: organizationB.id, UserId: user.id });

    authorizeStudio();
    const response = await request.get('/api/users/current/organizations');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: 'testorganization',
          name: 'Test Organization',
          role: PredefinedOrganizationRole.Owner,
        },
        { id: 'testorganizationb', name: null, role: PredefinedOrganizationRole.Member },
      ],
    });
  });
});
