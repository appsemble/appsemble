import dns from 'node:dns/promises';

import {
  type OrganizationSsoConfiguration,
  type OrganizationSsoDomain as DomainClaim,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
let user: User;

function signIn(authTime?: number): void {
  request.defaults.headers.common.authorization = `Bearer ${
    createJWTResponse(user.id, { loginMethod: 'password', authTime }).access_token
  }`;
}

async function addClaim(domain = 'example.com'): Promise<DomainClaim> {
  const response = await request.post<DomainClaim>(path, { domain });
  expect(response.status).toBe(201);
  return response.data;
}

describe('organization single sign-on domain discovery', () => {
  beforeAll(async () => {
    setArgv({
      host: 'http://localhost',
      secret: 'test',
      aesSecret: 'test-encryption',
      organizationSsoIssuers: configuration.issuer,
    });
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    user = await createTestUser();
    await Organization.create({ id: 'staff', name: 'Staff' });
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    signIn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows an Owner to list domains before SSO is configured', async () => {
    await OrganizationSso.destroy({ where: { OrganizationId: 'staff' } });
    const response = await request.get(path);
    expect({ status: response.status, data: response.data }).toStrictEqual({
      status: 200,
      data: [],
    });
    expect((await request.post(path, { domain: 'example.com' })).status).toBe(404);
  });

  it('creates an exact domain claim and an organization-specific ownership challenge', async () => {
    const claim = await addClaim(' Staff.Example.COM ');
    expect(claim).toStrictEqual({
      domain: 'staff.example.com',
      verified: false,
      managedBy: 'studio',
      recordName: '_appsemble-sso.staff.example.com',
      recordValue: expect.stringMatching(/^appsemble-sso=[a-f\d]{64}$/u),
    });
    expect((await request.get(path)).data).toStrictEqual([claim]);
  });

  it.each(['https://example.com', '*.example.com', 'example.com/path', '127.0.0.1'])(
    'rejects %s as an email discovery domain',
    async (domain) => {
      expect((await request.post(path, { domain })).status).toBe(400);
    },
  );

  it('makes a domain discoverable only after its TXT ownership challenge is verified', async () => {
    const claim = await addClaim();
    const pending = await request.post('/api/auth/email/discover', { email: 'new@example.com' });
    expect(pending.data).toStrictEqual({ organizations: [] });
    vi.spyOn(dns, 'resolveTxt').mockResolvedValue([
      [claim.recordValue.slice(0, 20), claim.recordValue.slice(20)],
    ]);
    const verified = await request.post(`${path}/example.com/verify`);
    expect({ status: verified.status, data: verified.data }).toStrictEqual({
      status: 200,
      data: { ...claim, verified: true },
    });
    unauthorize();
    const discovery = await request.post('/api/auth/email/discover', { email: 'new@example.com' });
    expect(discovery.data).toStrictEqual({
      organizations: [{ id: 'staff', name: 'Staff', ssoName: 'Staff SSO' }],
    });
  });

  it.each(['missing', 'mismatched'])('rejects a %s TXT ownership proof', async (proof) => {
    await addClaim();
    const resolve = vi.spyOn(dns, 'resolveTxt');
    if (proof === 'missing') {
      resolve.mockRejectedValue(new Error('ENOTFOUND'));
    } else {
      resolve.mockResolvedValue([['appsemble-sso=another-organization']]);
    }
    expect((await request.post(`${path}/example.com/verify`)).status).toBe(400);
    expect(
      (await request.post('/api/auth/email/discover', { email: 'new@example.com' })).data,
    ).toStrictEqual({ organizations: [] });
  });

  it('requires each organization sharing a domain to prove its own challenge', async () => {
    const original = await addClaim();
    await Organization.create({ id: 'other' });
    await applyOrganizationSsoConfiguration('other', configuration, 'studio');
    await OrganizationMember.create({
      OrganizationId: 'other',
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await request.post('/api/organizations/other/sso/domains', { domain: 'example.com' });
    vi.spyOn(dns, 'resolveTxt').mockResolvedValue([[original.recordValue]]);
    expect(
      (await request.post('/api/organizations/other/sso/domains/example.com/verify')).status,
    ).toBe(400);
  });

  it('discovers configured aliases without treating subdomains as implicit aliases', async () => {
    await OrganizationSsoDomain.bulkCreate(
      ['example.com', 'alias.example.org'].map((domain) => ({
        OrganizationId: 'staff',
        domain,
        token: 'verified-token',
        verifiedAt: new Date(),
        managedBy: 'studio',
      })),
    );
    const results = await Promise.all(
      ['new@example.com', 'new@alias.example.org', 'new@child.example.com'].map(
        async (email) => (await request.post('/api/auth/email/discover', { email })).data,
      ),
    );
    expect(results).toStrictEqual([
      { organizations: [{ id: 'staff', name: 'Staff', ssoName: 'Staff SSO' }] },
      { organizations: [{ id: 'staff', name: 'Staff', ssoName: 'Staff SSO' }] },
      { organizations: [] },
    ]);
  });

  it('returns every verified organization for a shared domain in a stable order', async () => {
    await Organization.create({ id: 'another', name: 'Another organization' });
    await applyOrganizationSsoConfiguration('another', configuration, 'deployment');
    await OrganizationSsoDomain.bulkCreate(
      ['staff', 'another'].map((OrganizationId) => ({
        OrganizationId,
        domain: 'example.com',
        managedBy: 'deployment',
        verifiedAt: new Date(),
      })),
    );
    unauthorize();
    const response = await request.post('/api/auth/email/discover', { email: 'new@EXAMPLE.COM' });
    expect(response.data).toStrictEqual({
      organizations: [
        { id: 'another', name: 'Another organization', ssoName: 'Staff SSO' },
        { id: 'staff', name: 'Staff', ssoName: 'Staff SSO' },
      ],
    });
  });

  it.each([undefined, 'staff'])(
    'keeps shared-domain discovery available after deleting the organization context %s',
    async (organizationId) => {
      await Organization.create({ id: 'active', name: 'Active organization' });
      await applyOrganizationSsoConfiguration('active', configuration, 'studio');
      await OrganizationSsoDomain.bulkCreate(
        ['staff', 'active'].map((OrganizationId) => ({
          OrganizationId,
          domain: 'example.com',
          managedBy: 'studio',
          verifiedAt: new Date(),
        })),
      );
      expect((await request.delete('/api/organizations/staff')).status).toBe(200);
      unauthorize();
      const response = await request.post('/api/auth/email/discover', {
        email: 'new@example.com',
        organizationId,
      });
      expect({ status: response.status, data: response.data }).toStrictEqual({
        status: 200,
        data: {
          organizations: [{ id: 'active', name: 'Active organization', ssoName: 'Staff SSO' }],
        },
      });
    },
  );

  it('prefers an explicit organization context even for an unclaimed guest domain', async () => {
    unauthorize();
    const response = await request.post('/api/auth/email/discover', {
      email: 'guest@gmail.com',
      organizationId: 'staff',
    });
    expect(response.data).toStrictEqual({
      organizations: [{ id: 'staff', name: 'Staff', ssoName: 'Staff SSO' }],
    });
  });

  it.each(['test@example.com', 'unknown@example.com', 'guest@gmail.com'])(
    'does not disclose account existence for %s',
    async (email) => {
      unauthorize();
      const response = await request.post('/api/auth/email/discover', { email });
      expect(response.data).toStrictEqual({ organizations: [] });
    },
  );

  it.each(['create', 'verify', 'delete'])(
    'requires a recently authenticated Owner to %s a domain claim',
    async (action) => {
      await addClaim();
      vi.spyOn(dns, 'resolveTxt').mockResolvedValue([]);
      const methods = {
        create: () => request.post(path, { domain: 'alias.example.com' }),
        verify: () => request.post(`${path}/example.com/verify`),
        delete: () => request.delete(`${path}/example.com`),
      };
      unauthorize();
      expect((await methods[action as keyof typeof methods]()).status).toBe(401);
      signIn(Date.now() / 1000 - 601);
      expect((await methods[action as keyof typeof methods]()).status).toBe(403);
      await OrganizationMember.update(
        { role: PredefinedOrganizationRole.Member },
        { where: { OrganizationId: 'staff', UserId: user.id } },
      );
      signIn();
      expect((await methods[action as keyof typeof methods]()).status).toBe(403);
    },
  );

  it('keeps deployment-managed discovery domains outside Studio control', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
    await OrganizationSsoDomain.create({
      OrganizationId: 'staff',
      domain: 'example.com',
      managedBy: 'deployment',
      verifiedAt: new Date(),
    });
    expect((await request.post(path, { domain: 'alias.example.com' })).status).toBe(409);
    expect((await request.post(`${path}/example.com/verify`)).status).toBe(409);
    expect((await request.delete(`${path}/example.com`)).status).toBe(409);
    expect((await request.get(path)).data).toStrictEqual([
      {
        domain: 'example.com',
        managedBy: 'deployment',
        verified: true,
        recordName: '_appsemble-sso.example.com',
        recordValue: '',
      },
    ]);
  });

  it('stops discovery immediately when an Owner removes a claim', async () => {
    await OrganizationSsoDomain.create({
      OrganizationId: 'staff',
      domain: 'example.com',
      managedBy: 'studio',
      verifiedAt: new Date(),
      token: 'verified-token',
    });
    expect((await request.delete(`${path}/example.com`)).status).toBe(204);
    expect(
      (await request.post('/api/auth/email/discover', { email: 'new@example.com' })).data,
    ).toStrictEqual({ organizations: [] });
  });

  it('removes discovery claims when their SSO configuration is deleted', async () => {
    await addClaim();
    expect((await request.delete('/api/organizations/staff/sso')).status).toBe(204);
    expect((await request.get(path)).data).toStrictEqual([]);
  });
});
