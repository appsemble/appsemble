import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { applyOrganizationSsoConfiguration } from '../../../utils/organizationSso.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

const issuer = 'https://identity.example.com/realms/staff';
let owner: User;

async function createServiceAccount(
  body: Record<string, unknown> = {},
): Promise<{ id: string; secret: string }> {
  authorizeStudio(owner);
  const { data } = await request.post('/api/organizations/staff/service-accounts', {
    description: 'Deployments',
    role: PredefinedOrganizationRole.AppManager,
    scopes: ['apps:write', 'organizations:write'],
    ...body,
  });
  return data;
}

function requestToken({ id, secret }: { id: string; secret: string }): Promise<{
  status: number;
  data: { access_token?: string; refresh_token?: string; error?: string };
}> {
  return request.post(
    '/auth/oauth2/token',
    new URLSearchParams({ grant_type: 'client_credentials', scope: 'organizations:write' }),
    {
      auth: { username: id, password: secret },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
  );
}

function getMembers(accessToken: string): Promise<{ status: number }> {
  return request.get('/api/organizations/staff/members', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

describe('organization service accounts', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({
      host: 'http://localhost',
      secret: 'test',
      aesSecret: 'test-encryption',
      organizationSsoIssuers: issuer,
    });
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    owner = await createTestUser();
    await Organization.create({ id: 'staff' });
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: owner.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('authenticates client credentials in an organization that requires single sign-on', async () => {
    const serviceAccount = await createServiceAccount();
    await applyOrganizationSsoConfiguration(
      'staff',
      {
        issuer,
        clientId: 'appsemble',
        clientSecret: 'client-secret',
        name: 'Staff',
        scope: 'openid email profile',
        groupClaim: 'groups',
        policy: 'required',
        allowedLoginMethods: ['oidc'],
        roleMappings: [{ group: '/owners', role: PredefinedOrganizationRole.Owner }],
      },
      'deployment',
    );
    const token = await requestToken(serviceAccount);

    expect({
      person: (await getMembers(authorizeStudio(owner).access_token)).status,
      serviceAccount: (await getMembers(token.data.access_token!)).status,
    }).toStrictEqual({ person: 403, serviceAccount: 200 });
  });

  it('lists service accounts apart from people without their secrets', async () => {
    const { id } = await createServiceAccount({ expires: '2026-02-01T00:00:00.000Z' });
    const members = await request.get('/api/organizations/staff/members');
    const serviceAccounts = await request.get('/api/organizations/staff/service-accounts');

    expect({
      members: members.data.map((member: { id: string }) => member.id),
      serviceAccounts: serviceAccounts.data,
    }).toStrictEqual({
      members: [owner.id],
      serviceAccounts: [
        {
          id,
          description: 'Deployments',
          role: PredefinedOrganizationRole.AppManager,
          scopes: ['apps:write', 'organizations:write'],
          expires: '2026-02-01T00:00:00.000Z',
          created: '2026-01-01T12:00:00.000Z',
        },
      ],
    });
  });

  it('never grants a service account the Owner role', async () => {
    await createServiceAccount();
    const created = await request.post('/api/organizations/staff/service-accounts', {
      description: 'Deployments',
      role: PredefinedOrganizationRole.Owner,
      scopes: ['apps:write'],
    });
    const member = await OrganizationMember.findOne({ where: { serviceAccount: true } });
    const promoted = await request.put(`/api/organizations/staff/members/${member!.UserId}/role`, {
      role: PredefinedOrganizationRole.Owner,
    });
    await member!.reload();

    expect({
      created: created.status,
      promoted: promoted.status,
      role: member!.role,
    }).toStrictEqual({ created: 400, promoted: 400, role: PredefinedOrganizationRole.AppManager });
  });

  it('gives a service account no Studio session and no organization of its own', async () => {
    const token = await requestToken(await createServiceAccount());
    const headers = { authorization: `Bearer ${token.data.access_token}` };
    const currentUser = await request.get('/api/users/current', { headers });
    const organization = await request.post(
      '/api/organizations',
      createFormData({ id: 'own', name: 'Own' }),
      { headers },
    );

    expect({
      refreshToken: token.data.refresh_token,
      currentUser: currentUser.status,
      organization: organization.status,
    }).toStrictEqual({ refreshToken: undefined, currentUser: 401, organization: 403 });
  });

  it('cuts access when a service account is revoked', async () => {
    const serviceAccount = await createServiceAccount();
    const token = await requestToken(serviceAccount);
    const before = await getMembers(token.data.access_token!);
    authorizeStudio(owner);
    const revoked = await request.delete(
      `/api/organizations/staff/service-accounts/${serviceAccount.id}`,
    );

    expect({
      before: before.status,
      revoked: revoked.status,
      after: (await getMembers(token.data.access_token!)).status,
      token: (await requestToken(serviceAccount)).data,
      serviceAccounts: (await request.get('/api/organizations/staff/service-accounts')).data,
    }).toStrictEqual({
      before: 200,
      revoked: 204,
      after: 401,
      token: { error: 'invalid_client' },
      serviceAccounts: [],
    });
  });

  it('cuts access when a service account expires', async () => {
    const serviceAccount = await createServiceAccount({ expires: '2026-01-01T12:30:00.000Z' });
    const token = await requestToken(serviceAccount);
    const before = await getMembers(token.data.access_token!);
    vi.setSystemTime(new Date('2026-01-01T12:31:00Z'));

    expect({
      before: before.status,
      after: (await getMembers(token.data.access_token!)).status,
      token: (await requestToken(serviceAccount)).data,
    }).toStrictEqual({ before: 200, after: 401, token: { error: 'invalid_grant' } });
  });

  it('lets only Owners of the organization manage its service accounts', async () => {
    const serviceAccount = await createServiceAccount();
    const maintainer = await createTestUser('maintainer@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: maintainer.id,
      role: PredefinedOrganizationRole.Maintainer,
    });
    const otherOwner = await createTestUser('other@example.com');
    await Organization.create({ id: 'other' });
    await OrganizationMember.create({
      OrganizationId: 'other',
      UserId: otherOwner.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio(maintainer);
    const listed = await request.get('/api/organizations/staff/service-accounts');
    const created = await request.post('/api/organizations/staff/service-accounts', {
      description: 'Deployments',
      role: PredefinedOrganizationRole.Member,
      scopes: [],
    });
    const revoked = await request.delete(
      `/api/organizations/staff/service-accounts/${serviceAccount.id}`,
    );
    authorizeStudio(otherOwner);
    const revokedElsewhere = await request.delete(
      `/api/organizations/other/service-accounts/${serviceAccount.id}`,
    );

    expect({
      listed: listed.status,
      created: created.status,
      revoked: revoked.status,
      revokedElsewhere: revokedElsewhere.status,
      token: (await requestToken(serviceAccount)).status,
    }).toStrictEqual({
      listed: 200,
      created: 403,
      revoked: 403,
      revokedElsewhere: 404,
      token: 200,
    });
  });
});
