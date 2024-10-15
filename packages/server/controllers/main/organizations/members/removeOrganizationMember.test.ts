import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('removeOrganizationMember', () => {
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

  it('should leave the organization if there are other members', async () => {
    // Set member role to the lowest available role, since this should not require any permissions
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });

    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await OrganizationMember.create({
      UserId: userB.id,
      OrganizationId: organization.id,
      role: 'Member',
    });

    authorizeStudio();
    const result = await request.delete(`/api/organizations/testorganization/members/${user.id}`);

    expect(result.status).toBe(204);
  });

  it('should remove other members from an organization', async () => {
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    await OrganizationMember.create({
      UserId: userB.id,
      OrganizationId: organization.id,
      role: 'Member',
    });

    authorizeStudio();
    const { status } = await request.delete(
      `/api/organizations/testorganization/members/${userB.id}`,
    );

    expect(status).toBe(204);
  });

  it('should not remove the only remaining member in an organization', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/organizations/testorganization/members/${user.id}`);

    expect(response).toMatchObject({
      status: 406,
      data: {
        message:
          'Not allowed to remove yourself from an organization if you’re the only member left.',
      },
    });
  });

  it('should not remove non-members or non-existing users from an organization', async () => {
    const userB = await User.create({ timezone: 'Europe/Amsterdam' });
    authorizeStudio();
    const responseA = await request.delete(
      `/api/organizations/testorganization/members/${userB.id}`,
    );
    const responseB = await request.delete('/api/organizations/testorganization/members/0', {});

    expect(responseA).toMatchObject({
      status: 404,
      data: { message: 'This member is not part of this organization.' },
    });

    expect(responseB).toMatchObject({
      status: 404,
      data: { message: 'This member is not part of this organization.' },
    });
  });
});
