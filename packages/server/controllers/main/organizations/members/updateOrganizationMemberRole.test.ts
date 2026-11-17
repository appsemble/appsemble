import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

describe('updateOrganizationMemberRole', () => {
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

  it('should change the role of other members', async () => {
    const userB = await User.create({
      name: 'Foo',
      primaryEmail: 'test2@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await OrganizationMember.create({
      UserId: userB.id,
      OrganizationId: organization.id,
      role: 'Member',
    });

    authorizeStudio();
    const response = await request.put(
      `/api/organizations/testorganization/members/${userB.id}/role`,
      { role: PredefinedOrganizationRole.Maintainer },
    );

    expect(response).toMatchObject({
      status: 200,
      data: {
        id: userB.id,
        name: 'Foo',
        primaryEmail: 'test2@example.com',
        role: PredefinedOrganizationRole.Maintainer,
      },
    });
  });

  it('retains an Owner when both Owners reduce each other roles concurrently', async () => {
    const colleague = await User.create({ timezone: 'Europe/Amsterdam' });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: colleague.id,
      role: 'Owner',
    });
    await Promise.all(
      [
        { actor: user, target: colleague },
        { actor: colleague, target: user },
      ].map(({ actor, target }) =>
        request.put(
          `/api/organizations/testorganization/members/${target.id}/role`,
          { role: 'Member' },
          { headers: { authorization: `Bearer ${createJWTResponse(actor.id).access_token}` } },
        ),
      ),
    );
    expect(
      await OrganizationMember.count({ where: { OrganizationId: organization.id, role: 'Owner' } }),
    ).toBe(1);
  });
});
