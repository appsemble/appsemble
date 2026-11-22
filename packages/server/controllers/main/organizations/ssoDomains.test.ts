import {
  type OrganizationSsoConfiguration,
  type OrganizationSsoDomains,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoDomain,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createJWTResponse } from '../../../utils/createJWTResponse.js';
import { createServer } from '../../../utils/createServer.js';
import { applyOrganizationSsoConfiguration } from '../../../utils/organizationSso.js';
import { createTestUser, unauthorize } from '../../../utils/test/authorization.js';

const { resolveTxt } = vi.hoisted(() => ({
  resolveTxt: vi.fn<(hostname: string) => Promise<string[][]>>(),
}));

vi.mock('node:dns/promises', async (importOriginal) => {
  const dns = await importOriginal<typeof import('node:dns/promises')>();
  return { ...dns, default: { ...dns, resolveTxt }, resolveTxt };
});

const path = '/api/organizations/staff/sso/domains';
const configuration: OrganizationSsoConfiguration = {
  issuer: 'https://identity.example.com',
  clientId: 'studio',
  clientSecret: 'secret',
  name: 'Staff SSO',
  scope: 'openid email profile',
  groupClaim: 'groups',
  roleMappings: [],
  policy: 'optional',
  allowedLoginMethods: ['password', 'oidc'],
};
const staff = { id: 'staff', name: 'Staff', ssoName: 'Staff SSO' };
let user: User;

function signIn(authTime?: number): void {
  request.defaults.headers.common.authorization = `Bearer ${
    createJWTResponse(user.id, { loginMethod: 'password', authTime }).access_token
  }`;
}

function publishTxt(records: Record<string, string>): void {
  resolveTxt.mockImplementation((hostname) =>
    hostname in records
      ? Promise.resolve([
          ['v=spf1 -all'],
          [records[hostname].slice(0, 20), records[hostname].slice(20)],
        ])
      : Promise.reject(new Error(`queryTxt ENOTFOUND ${hostname}`)),
  );
}

async function getDomains(organizationId = 'staff'): Promise<OrganizationSsoDomains> {
  const response = await request.get<OrganizationSsoDomains>(
    `/api/organizations/${organizationId}/sso/domains`,
  );
  expect(response.status).toBe(200);
  return response.data;
}

async function discover(email: string): Promise<unknown> {
  const { data } = await request.post('/api/auth/email/discover', { email });
  return data.organizations;
}

async function addOrganization(id: string, managedBy: 'deployment' | 'studio'): Promise<void> {
  await Organization.create({ id, name: `${id} organization` });
  await OrganizationMember.create({
    OrganizationId: id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
  await applyOrganizationSsoConfiguration(id, configuration, managedBy);
}

beforeAll(async () => {
  setArgv({
    host: 'http://localhost',
    secret: 'test',
    aesSecret: 'test-encryption',
    organizationSsoIssuers: configuration.issuer,
  });
  await setTestApp(await createServer());
});

describe('organization single sign-on domains', () => {
  beforeEach(async () => {
    user = await createTestUser();
    await Organization.create({ id: 'staff', name: 'Staff' });
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    publishTxt({});
    signIn();
  });

  it('adds a domain whose TXT record holds the organization value and makes it discoverable', async () => {
    const { recordValue } = await getDomains();
    publishTxt({ '_appsemble-sso.staff.example.com': recordValue });
    const response = await request.post(path, { domain: ' Staff.Example.COM ' });
    unauthorize();
    expect({
      recordValue,
      status: response.status,
      data: response.data,
      discovered: await discover('new@staff.example.com'),
    }).toStrictEqual({
      recordValue: expect.stringMatching(/^appsemble-sso=[a-f\d]{64}$/u),
      status: 201,
      data: { recordValue, domains: ['staff.example.com'] },
      discovered: [staff],
    });
  });

  it('accepts the same organization value for each of its domains and lists them in order', async () => {
    const { recordValue } = await getDomains();
    publishTxt({
      '_appsemble-sso.example.org': recordValue,
      '_appsemble-sso.example.com': recordValue,
    });
    expect((await request.post(path, { domain: 'example.org' })).status).toBe(201);
    const response = await request.post(path, { domain: 'example.com' });
    expect({ status: response.status, data: response.data }).toStrictEqual({
      status: 201,
      data: { recordValue, domains: ['example.com', 'example.org'] },
    });
    expect(await getDomains()).toStrictEqual(response.data);
  });

  it.each([
    ['a missing TXT record', () => Promise.resolve({})],
    [
      "another organization's TXT record",
      async () => {
        await addOrganization('other', 'studio');
        return { '_appsemble-sso.example.com': (await getDomains('other')).recordValue };
      },
    ],
  ])('refuses a domain proven by %s', async (description, getRecords) => {
    publishTxt(await getRecords());
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(400);
    expect({
      domains: (await getDomains()).domains,
      discovered: await discover('new@example.com'),
    }).toStrictEqual({ domains: [], discovered: [] });
  });

  it.each(['https://example.com', '*.example.com', 'example.com/path', '127.0.0.1'])(
    'rejects %s as an email discovery domain even when its TXT record matches',
    async (domain) => {
      publishTxt({ [`_appsemble-sso.${domain}`]: (await getDomains()).recordValue });
      expect((await request.post(path, { domain })).status).toBe(400);
      expect(await OrganizationSsoDomain.count()).toBe(0);
    },
  );

  it('refuses a domain the organization already has, even when its record is gone', async () => {
    publishTxt({ '_appsemble-sso.example.com': (await getDomains()).recordValue });
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(201);
    publishTxt({});
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(409);
  });

  it('refuses a domain added by another request while its record was checked', async () => {
    const { recordValue } = await getDomains();
    resolveTxt.mockImplementation(async () => {
      await OrganizationSsoDomain.create({ OrganizationId: 'staff', domain: 'example.com' });
      return [[recordValue]];
    });
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(409);
  });

  it('refuses a domain when the deployment takes over SSO while its record was checked', async () => {
    const { recordValue } = await getDomains();
    resolveTxt.mockImplementation(async () => {
      await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
      return [[recordValue]];
    });
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(409);
    expect((await getDomains()).domains).toStrictEqual([]);
  });

  it('requires a recent sign-in to add or remove a domain', async () => {
    await OrganizationSsoDomain.create({ OrganizationId: 'staff', domain: 'example.com' });
    signIn(Date.now() / 1000 - 601);
    expect({
      add: (await request.post(path, { domain: 'example.org' })).status,
      remove: (await request.delete(`${path}/example.com`)).status,
      domains: (await getDomains()).domains,
    }).toStrictEqual({ add: 403, remove: 403, domains: ['example.com'] });
  });

  it.each(['a non-member', 'a Member'])('refuses %s access to the domains', async (who) => {
    await (who === 'a Member'
      ? OrganizationMember.update(
          { role: PredefinedOrganizationRole.Member },
          { where: { OrganizationId: 'staff', UserId: user.id } },
        )
      : OrganizationMember.destroy({ where: { OrganizationId: 'staff', UserId: user.id } }));
    expect({
      list: (await request.get(path)).status,
      add: (await request.post(path, { domain: 'example.com' })).status,
      stored: await OrganizationSsoDomain.count(),
    }).toStrictEqual({ list: 403, add: 403, stored: 0 });
  });

  it('requires authentication to manage domains', async () => {
    unauthorize();
    expect({
      list: (await request.get(path)).status,
      add: (await request.post(path, { domain: 'example.com' })).status,
      remove: (await request.delete(`${path}/example.com`)).status,
    }).toStrictEqual({ list: 401, add: 401, remove: 401 });
  });

  it('lists no domains and refuses additions before SSO is configured', async () => {
    await OrganizationSso.destroy({ where: { OrganizationId: 'staff' } });
    expect((await getDomains()).domains).toStrictEqual([]);
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(404);
  });

  it('leaves deployment-managed domains to the deployment', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
    await OrganizationSsoDomain.create({ OrganizationId: 'staff', domain: 'example.com' });
    expect({
      add: (await request.post(path, { domain: 'example.org' })).status,
      remove: (await request.delete(`${path}/example.com`)).status,
      domains: (await getDomains()).domains,
    }).toStrictEqual({ add: 409, remove: 409, domains: ['example.com'] });
  });

  it('stops discovery when an Owner removes a domain', async () => {
    await OrganizationSsoDomain.create({ OrganizationId: 'staff', domain: 'example.com' });
    expect({
      removed: (await request.delete(`${path}/Example.COM`)).status,
      discovered: await discover('new@example.com'),
      again: (await request.delete(`${path}/example.com`)).status,
      invalid: (await request.delete(`${path}/under_score.example.com`)).status,
    }).toStrictEqual({ removed: 204, discovered: [], again: 404, invalid: 400 });
  });

  it('removes domains when their SSO configuration is deleted', async () => {
    await OrganizationSsoDomain.create({ OrganizationId: 'staff', domain: 'example.com' });
    expect((await request.delete('/api/organizations/staff/sso')).status).toBe(204);
    expect(await discover('new@example.com')).toStrictEqual([]);
  });
});

describe('organization single sign-on discovery', () => {
  beforeEach(async () => {
    user = await createTestUser();
    await Organization.create({ id: 'staff', name: 'Staff' });
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    unauthorize();
  });

  it('discovers exact domains and aliases without treating subdomains as aliases', async () => {
    await OrganizationSsoDomain.bulkCreate(
      ['example.com', 'alias.example.org'].map((domain) => ({ OrganizationId: 'staff', domain })),
    );
    expect({
      domain: await discover('new@example.com'),
      alias: await discover('new@alias.example.org'),
      subdomain: await discover('new@child.example.com'),
    }).toStrictEqual({ domain: [staff], alias: [staff], subdomain: [] });
  });

  it('returns every organization claiming a domain in id order', async () => {
    await addOrganization('zeta', 'studio');
    await addOrganization('another', 'deployment');
    await OrganizationSsoDomain.bulkCreate(
      ['zeta', 'staff', 'another'].map((OrganizationId) => ({
        OrganizationId,
        domain: 'example.com',
      })),
    );
    expect(await discover('new@EXAMPLE.COM')).toStrictEqual([
      { id: 'another', name: 'another organization', ssoName: 'Staff SSO' },
      staff,
      { id: 'zeta', name: 'zeta organization', ssoName: 'Staff SSO' },
    ]);
  });

  it('leaves out a deleted organization', async () => {
    await addOrganization('active', 'studio');
    await OrganizationSsoDomain.bulkCreate(
      ['staff', 'active'].map((OrganizationId) => ({ OrganizationId, domain: 'example.com' })),
    );
    await Organization.destroy({ where: { id: 'staff' } });
    expect(await discover('new@example.com')).toStrictEqual([
      { id: 'active', name: 'active organization', ssoName: 'Staff SSO' },
    ]);
  });

  it('leaves out a Studio-managed provider whose issuer is no longer allowed', async () => {
    await addOrganization('deployed', 'deployment');
    await OrganizationSso.update({ issuer: 'https://retired.example.com' }, { where: {} });
    await OrganizationSsoDomain.bulkCreate(
      ['staff', 'deployed'].map((OrganizationId) => ({ OrganizationId, domain: 'example.com' })),
    );
    expect(await discover('new@example.com')).toStrictEqual([
      { id: 'deployed', name: 'deployed organization', ssoName: 'Staff SSO' },
    ]);
  });

  it.each(['new@[127.0.0.1]', 'new@127.0.0.1'])(
    'finds no organizations for an email domain that cannot be claimed: %s',
    async (email) => {
      const response = await request.post('/api/auth/email/discover', { email });
      expect({ status: response.status, data: response.data }).toStrictEqual({
        status: 200,
        data: { organizations: [] },
      });
    },
  );

  it.each(['test@example.com', 'unknown@example.com', 'guest@gmail.com'])(
    'does not disclose account existence for %s',
    async (email) => {
      expect(await discover(email)).toStrictEqual([]);
    },
  );

  it('does not accept an organization context', async () => {
    await OrganizationSsoDomain.create({ OrganizationId: 'staff', domain: 'example.com' });
    const response = await request.post('/api/auth/email/discover', {
      email: 'new@example.com',
      organizationId: 'staff',
    });
    expect(response.status).toBe(400);
  });
});
