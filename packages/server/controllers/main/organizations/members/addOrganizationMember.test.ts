import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;

async function createAccount(email: string, verified = true): Promise<User> {
  const account = await User.create({
    name: 'Other User',
    primaryEmail: email,
    timezone: 'Europe/Amsterdam',
  });
  await EmailAuthorization.create({ UserId: account.id, email, verified });
  return account;
}

describe('addOrganizationMember', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should add an existing account to the organization', async () => {
    const account = await createAccount('other@example.com');

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/members', {
      email: 'other@example.com',
      role: PredefinedOrganizationRole.AppManager,
    });

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: account.id,
        name: 'Other User',
        primaryEmail: 'other@example.com',
        role: PredefinedOrganizationRole.AppManager,
      },
    });
    expect(
      await OrganizationMember.findOne({
        where: { OrganizationId: 'testorganization', UserId: account.id },
      }),
    ).toMatchObject({ role: PredefinedOrganizationRole.AppManager });
  });

  it('should let a client credentials token add an account to the organization', async () => {
    const account = await createAccount('other@example.com');

    await authorizeClientCredentials('organizations:write');
    const response = await request.post('/api/organizations/testorganization/members', {
      email: 'other@example.com',
      role: PredefinedOrganizationRole.Member,
    });

    expect(response).toMatchObject({ status: 201, data: { id: account.id } });
  });

  it('should require the permission the invite endpoint requires', async () => {
    await createAccount('other@example.com');
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { UserId: user.id } },
    );

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/members', {
      email: 'other@example.com',
      role: PredefinedOrganizationRole.Member,
    });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User does not have sufficient organization permissions.' },
    });
    expect(await OrganizationMember.count({ where: { OrganizationId: 'testorganization' } })).toBe(
      1,
    );
  });

  it('should not let an outsider join an organization', async () => {
    await Organization.create({ id: 'org' });
    await createAccount('other@example.com');

    await authorizeClientCredentials('organizations:write');
    const response = await request.post('/api/organizations/org/members', {
      email: 'test@example.com',
      role: PredefinedOrganizationRole.Owner,
    });

    expect(response).toMatchObject({
      status: 403,
      data: { message: 'User is not a member of this organization.' },
    });
    expect(await OrganizationMember.count({ where: { OrganizationId: 'org' } })).toBe(0);
  });

  it('should not add an account without a known email address', async () => {
    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/members', {
      email: 'unknown@example.com',
      role: PredefinedOrganizationRole.Member,
    });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'No account was found for this email address.' },
    });
  });

  it('should not add an account by an unverified email address', async () => {
    const account = await createAccount('other@example.com', false);

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/members', {
      email: 'other@example.com',
      role: PredefinedOrganizationRole.Member,
    });

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'This email address has not been verified.' },
    });
    expect(await OrganizationMember.count({ where: { UserId: account.id } })).toBe(0);
  });

  it('should not change the role of an existing member', async () => {
    const account = await createAccount('other@example.com');
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: account.id,
      role: PredefinedOrganizationRole.Member,
    });

    authorizeStudio();
    const response = await request.post('/api/organizations/testorganization/members', {
      email: 'other@example.com',
      role: PredefinedOrganizationRole.Owner,
    });

    expect(response).toMatchObject({
      status: 409,
      data: { message: 'This account is already a member of this organization.' },
    });
    expect(await OrganizationMember.findOne({ where: { UserId: account.id } })).toMatchObject({
      role: PredefinedOrganizationRole.Member,
    });
  });

  it('should not add an account to an unknown organization', async () => {
    await createAccount('other@example.com');

    authorizeStudio();
    const response = await request.post('/api/organizations/unknown/members', {
      email: 'other@example.com',
      role: PredefinedOrganizationRole.Member,
    });

    expect(response).toMatchObject({
      status: 404,
      data: { message: 'Organization not found.' },
    });
  });
});
