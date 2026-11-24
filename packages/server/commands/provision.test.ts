import { PredefinedOrganizationRole, SubscriptionPlanType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { provision, type ProvisionOptions } from './provision.js';
import { OAuth2ClientCredentials, OrganizationMember, User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { reconcileDNS } from '../utils/dns/index.js';
import { authorizeStudio } from '../utils/test/authorization.js';

vi.mock(import('../utils/dns/index.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  reconcileDNS: vi.fn(),
}));

const options: ProvisionOptions = {
  clientCredentials: 'client:secret',
  organizationId: 'example',
  organizationSubscription: SubscriptionPlanType.Enterprise,
  skipCustomDomains: false,
};

function requestToken(secret: string): Promise<{ status: number }> {
  return request.post(
    '/auth/oauth2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'apps:write assets:write blocks:write resources:write',
    }),
    {
      auth: { username: 'client', password: secret },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
  );
}

describe('provision', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    await setTestApp(await createServer());
  });

  it('provisions a first Owner and a service account whose client credentials authenticate', async () => {
    await provision({
      ...options,
      organizationRole: PredefinedOrganizationRole.Owner,
      userEmail: 'owner@example.com',
      userName: 'Owner',
      userPassword: 'owner-password',
      userTimezone: 'Europe/Amsterdam',
    });
    const login = await request.post('/api/auth/email/login', undefined, {
      auth: { username: 'owner@example.com', password: 'owner-password' },
    });
    authorizeStudio((await User.findOne({ where: { primaryEmail: 'owner@example.com' } }))!);
    const members = await request.get('/api/organizations/example/members');
    const serviceAccounts = await request.get('/api/organizations/example/service-accounts');
    const token = await requestToken('secret');

    expect({
      login: login.status,
      members: members.data,
      serviceAccounts: serviceAccounts.data,
      token: token.status,
    }).toMatchObject({
      login: 200,
      members: [{ primaryEmail: 'owner@example.com', role: PredefinedOrganizationRole.Owner }],
      serviceAccounts: [{ id: 'client', role: PredefinedOrganizationRole.Maintainer }],
      token: 200,
    });
  });

  it('restores the provisioned service account with a rotated secret when it runs again', async () => {
    await provision(options);
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Member },
      { where: { serviceAccount: true } },
    );
    await OAuth2ClientCredentials.update({ expires: new Date(0) }, { where: { id: 'client' } });
    await provision({ ...options, clientCredentials: 'client:rotated' });
    const serviceAccounts = await OrganizationMember.findAll({
      where: { OrganizationId: 'example', serviceAccount: true },
    });

    expect({
      previous: (await requestToken('secret')).status,
      rotated: (await requestToken('rotated')).status,
      roles: serviceAccounts.map(({ role }) => role),
    }).toStrictEqual({
      previous: 400,
      rotated: 200,
      roles: [PredefinedOrganizationRole.Maintainer],
    });
  });

  it('refuses client credentials of another account', async () => {
    const user = await User.create({ name: 'Bot', timezone: 'UTC' });
    await OAuth2ClientCredentials.create({
      id: 'client',
      description: 'Bot',
      scopes: 'apps:write',
      secret: 'previous',
      UserId: user.id,
    });

    await expect(provision(options)).rejects.toThrow(
      'Client credentials client belong to an account other than a service account of example.',
    );
  });

  it('preserves a service account when another organization tries to reuse its client ID', async () => {
    await provision({ ...options, organizationId: 'other' });

    await expect(provision({ ...options, clientCredentials: 'client:rotated' })).rejects.toThrow(
      'Client credentials client belong to an account other than a service account of example.',
    );
    expect((await requestToken('secret')).status).toBe(200);
  });

  it('reconciles dns for an app domain strategy', async () => {
    await provision({
      ...options,
      appDomainStrategy: 'kubernetes-ingress',
      host: 'https://1234.appsemble.review',
    });

    expect(reconcileDNS).toHaveBeenCalledWith({ dryRun: false, skipCustomDomains: false });
  });

  it('fails fast on invalid client credentials', async () => {
    await expect(
      provision({
        ...options,
        clientCredentials: 'invalid',
      }),
    ).rejects.toThrow('The --client-credentials value must be formatted as <id>:<secret>.');
  });
});
