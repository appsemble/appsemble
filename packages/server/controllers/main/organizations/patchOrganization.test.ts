import { createFormData, readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../utils/test/testSchema.js';

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

describe('patchOrganization', () => {
  it('should update the name of the organization', async () => {
    authorizeStudio();
    const response = await request.patch(
      `/api/organizations/${organization.id}`,
      createFormData({ name: 'Test' }),
    );
    expect(response).toMatchObject({ data: { id: organization.id, name: 'Test' } });
  });

  it('should update the logo of the organization', async () => {
    const formData = new FormData();
    const buffer = await readFixture('testpattern.png');

    formData.append('icon', buffer, { filename: 'icon.png' });

    authorizeStudio();
    const response = await request.patch(`/api/organizations/${organization.id}`, formData);

    await organization.reload();

    expect(response).toMatchObject({ data: { id: organization.id, name: 'Test Organization' } });
    expect(organization.icon).toStrictEqual(buffer);
  });

  it('should not allow anything if the user is not an owner', async () => {
    await OrganizationMember.update(
      { role: 'Member' },
      { where: { OrganizationId: organization.id, UserId: user.id } },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/organizations/${organization.id}`,
      createFormData({ name: 'Test' }),
    );
    expect(response).toMatchObject({
      data: { message: 'User does not have sufficient permissions.' },
      status: 403,
    });
  });
});
