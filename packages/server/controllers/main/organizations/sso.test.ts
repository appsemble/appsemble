import { type OrganizationSsoConfiguration, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppCollection,
  BlockVersion,
  Organization,
  OrganizationInvite,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createJWTResponse } from '../../../utils/createJWTResponse.js';
import { createServer } from '../../../utils/createServer.js';
import { applyOrganizationSsoConfiguration } from '../../../utils/organizationSso.js';
import { createTestUser } from '../../../utils/test/authorization.js';

const configuration: OrganizationSsoConfiguration = {
  issuer: 'https://identity.example.com/realms/staff',
  clientId: 'appsemble',
  clientSecret: 'client-secret',
  name: 'Staff',
  scope: 'openid email profile',
  groupClaim: 'groups',
  policy: 'optional',
  allowedLoginMethods: ['password', 'oidc'],
  roleMappings: [
    { group: '/editors', role: PredefinedOrganizationRole.AppContentsManager },
    { group: '/members', role: PredefinedOrganizationRole.AppMemberManager },
  ],
};
let user: User;

function signIn(options: Parameters<typeof createJWTResponse>[1] = {}): void {
  request.defaults.headers.common.authorization = `Bearer ${
    createJWTResponse(user.id, {
      loginMethod: 'password',
      ...options,
    }).access_token
  }`;
}

async function signInWithSso(
  groups = ['/editors', '/members'],
  providerConfiguration = configuration,
): Promise<void> {
  const sso = await applyOrganizationSsoConfiguration('staff', providerConfiguration, 'deployment');
  const identity = await OrganizationSsoIdentity.create({
    issuer: sso.issuer,
    subject: user.id,
    UserId: user.id,
  });
  const session = await OrganizationSsoSession.create({
    OrganizationId: 'staff',
    OrganizationSsoIdentityId: identity.id,
    configurationUpdated: sso.configurationUpdated,
    accessToken: Buffer.from('token'),
    refreshTokenHash: 'hash',
    accessTokenExpires: new Date(Date.now() + 3_600_000),
    expires: new Date(Date.now() + 28_800_000),
    groups,
  });
  signIn({ loginMethod: 'oidc', organizationSsoSessionId: session.id });
}

async function authorizePersonalCli(): Promise<void> {
  const credentials = await request.post('/api/users/current/auth/oauth2/client-credentials', {
    description: 'Staff CLI',
    scopes: ['organizations:write'],
  });
  const response = await request.post(
    '/auth/oauth2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'organizations:write',
    }),
    {
      auth: { username: credentials.data.id, password: credentials.data.secret },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
  );
  request.defaults.headers.common.authorization = `Bearer ${response.data.access_token}`;
}

describe('organization single sign-on', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test-encryption' });
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    user = await createTestUser();
    await Organization.create({ id: 'staff' });
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    signIn();
  });

  it('returns an unconfigured provider as JSON null', async () => {
    const response = await request.get('/api/organizations/staff/sso');
    expect({ status: response.status, data: response.data }).toStrictEqual({
      status: 200,
      data: null,
    });
  });

  it('lets an Owner update verified settings without returning the client secret', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    const response = await request.put('/api/organizations/staff/sso', configuration);
    const publicConfiguration = Object.fromEntries(
      Object.entries(configuration).filter(([key]) => key !== 'clientSecret'),
    );
    expect(response).toMatchObject({
      status: 200,
      data: { ...publicConfiguration, managedBy: 'studio', hasClientSecret: true },
    });
    expect(response.data).not.toHaveProperty('clientSecret');
  });

  it('requires provider verification before saving a new connection', async () => {
    const response = await request.put('/api/organizations/staff/sso', configuration);
    expect(response.status).toBe(409);
  });

  it('requires verification before replacing the secret of an existing provider', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    const response = await request.put('/api/organizations/staff/sso', {
      ...configuration,
      clientSecret: 'wrong-secret',
    });
    expect(response.status).toBe(409);
  });

  it('rejects provider changes by members without Owner permission', async () => {
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    const response = await request.put('/api/organizations/staff/sso', configuration);
    expect(response.status).toBe(403);
  });

  it('requires recent authentication when changing the provider', async () => {
    signIn({ authTime: Date.now() / 1000 - 601 });
    const response = await request.put('/api/organizations/staff/sso', configuration);
    expect(response.status).toBe(403);
  });

  it('requires a tested Owner mapping before enforcing single sign-on', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    const response = await request.put('/api/organizations/staff/sso', {
      ...configuration,
      policy: 'required',
    });
    expect(response.status).toBe(403);
  });

  it('does not let an optional policy disable the Owner current login', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'studio');
    const response = await request.put('/api/organizations/staff/sso', {
      ...configuration,
      allowedLoginMethods: ['oidc'],
    });
    expect(response.status).toBe(403);
  });

  it.each([
    { role: 'Member', billing: undefined },
    { role: 'Owner', billing: 'Staff billing' },
  ])(
    'returns current organization billing only to a $role with billing authority',
    async ({ role, billing }) => {
      await Organization.update({ invoiceReference: 'Staff billing' }, { where: { id: 'staff' } });
      await OrganizationMember.update({ role }, { where: { UserId: user.id } });
      const response = await request.get('/api/users/current/organizations');
      expect(response.data[0].invoiceReference).toBe(billing);
    },
  );

  it('keeps deployment-managed configuration read-only in Studio', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
    const response = await request.put('/api/organizations/staff/sso', configuration);
    expect(response.status).toBe(409);
  });

  it('preserves active sessions when applying unchanged deployment configuration', async () => {
    await signInWithSso();
    await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
    const response = await request.get('/api/organizations/staff/members');
    expect(response.status).toBe(200);
  });

  it.each([
    { guest: false, policy: 'required-with-guests', status: 403 },
    { guest: true, policy: 'required-with-guests', status: 200 },
    { guest: true, policy: 'required', status: 403 },
  ] as const)(
    'honors guest=$guest invitations under $policy',
    async ({ guest, policy, status }) => {
      await applyOrganizationSsoConfiguration('staff', { ...configuration, policy }, 'deployment');
      user = await createTestUser('colleague@example.com');
      await OrganizationInvite.create({
        OrganizationId: 'staff',
        UserId: user.id,
        email: user.primaryEmail,
        key: 'invitation',
        role: 'Member',
        guest,
      });
      signIn();
      await request.post('/api/organization-invites/invitation/respond', { response: true });
      const response = await request.get('/api/organizations/staff/members');
      expect(response.status).toBe(status);
    },
  );

  it('replaces a staff member manual grant with all mapped roles', async () => {
    const colleague = await createTestUser('colleague@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: colleague.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await signInWithSso();
    const response = await request.get('/api/users/current/organizations');
    expect(response.data).toMatchObject([
      {
        id: 'staff',
        role: null,
        roles: ['AppContentsManager', 'AppMemberManager'],
        guest: false,
      },
    ]);
  });

  it('keeps the manual role of the last Owner when mapped groups do not grant Owner', async () => {
    await signInWithSso();
    const response = await request.get('/api/users/current/organizations');
    expect(response.data).toMatchObject([
      { id: 'staff', role: 'Owner', roles: ['Owner'], guest: false },
    ]);
  });

  it('lets the provider downgrade the last mapped Owner', async () => {
    await signInWithSso(['/owners'], {
      ...configuration,
      roleMappings: [
        ...configuration.roleMappings,
        { group: '/owners', role: PredefinedOrganizationRole.Owner },
      ],
    });
    await request.get('/api/organizations/staff/members');
    await OrganizationSsoSession.update(
      { groups: ['/editors'] },
      { where: { OrganizationId: 'staff' } },
    );
    const response = await request.get('/api/users/current/organizations');
    expect(response.data).toMatchObject([
      { id: 'staff', role: null, roles: ['AppContentsManager'], guest: false },
    ]);
  });

  it('does not restore a manual grant when managed staff lose all mapped groups', async () => {
    await signInWithSso();
    await request.get('/api/organizations/staff/members');
    await OrganizationSsoSession.update({ groups: [] }, { where: { OrganizationId: 'staff' } });
    const response = await request.get('/api/organizations/staff/members');
    expect(response.status).toBe(403);
  });

  it('does not reuse one organization provider session for another organization', async () => {
    await signInWithSso();
    await Organization.create({ id: 'other' });
    await OrganizationMember.create({ OrganizationId: 'other', UserId: user.id, role: null });
    await applyOrganizationSsoConfiguration(
      'other',
      { ...configuration, policy: 'required' },
      'deployment',
    );
    const response = await request.get('/api/organizations/other/members');
    expect(response.status).toBe(403);
  });

  it('hides private apps and collections from a member using a disallowed login', async () => {
    await applyOrganizationSsoConfiguration(
      'staff',
      { ...configuration, policy: 'required' },
      'deployment',
    );
    await App.create({
      OrganizationId: 'staff',
      path: 'private-app',
      definition: { name: 'Private App', defaultPage: 'Home' },
      visibility: 'private',
      vapidPrivateKey: '',
      vapidPublicKey: '',
    });
    const collection = await AppCollection.create({
      OrganizationId: 'staff',
      name: 'Private Collection',
      visibility: 'private',
      expertName: 'Staff',
      headerImage: Buffer.from('header'),
      headerImageMimeType: 'image/png',
      expertProfileImage: Buffer.from('profile'),
      expertProfileImageMimeType: 'image/png',
    });
    const apps = await request.get('/api/organizations/staff/apps');
    const collections = await request.get('/api/organizations/staff/app-collections');
    const privateCollection = await request.get(`/api/app-collections/${collection.id}`);
    expect({
      apps: apps.data,
      collections: collections.data,
      privateCollection: privateCollection.status,
    }).toStrictEqual({ apps: [], collections: [], privateCollection: 403 });
  });

  it('blocks an existing provider session after organization membership is removed', async () => {
    await signInWithSso();
    await request.get('/api/organizations/staff/members');
    await OrganizationMember.destroy({ where: { OrganizationId: 'staff', UserId: user.id } });
    const response = await request.get('/api/organizations/staff/members');
    expect(response.status).toBe(403);
  });

  it('does not let password-created personal credentials bypass required staff SSO', async () => {
    await authorizePersonalCli();
    await applyOrganizationSsoConfiguration(
      'staff',
      { ...configuration, policy: 'required' },
      'deployment',
    );
    const response = await request.get('/api/organizations/staff/members');
    expect(response.status).toBe(403);
  });

  it('does not accept a personal CLI token as recent interactive Owner authentication', async () => {
    await authorizePersonalCli();
    const response = await request.put('/api/organizations/staff/sso', configuration);
    expect(response.status).toBe(401);
  });

  it('revokes personal CLI organization access when membership is removed', async () => {
    await signInWithSso();
    await authorizePersonalCli();
    const before = await request.get('/api/organizations/staff/members');
    await OrganizationMember.destroy({ where: { OrganizationId: 'staff', UserId: user.id } });
    const after = await request.get('/api/organizations/staff/members');
    expect([before.status, after.status]).toStrictEqual([200, 403]);
  });

  it('requires an explicit guest conversion before replacing group-managed roles', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
    const colleague = await createTestUser('colleague@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: colleague.id,
      role: null,
      ssoRoles: ['AppManager'],
    });
    const denied = await request.put(`/api/organizations/staff/members/${colleague.id}/role`, {
      role: 'Member',
    });
    const converted = await request.put(`/api/organizations/staff/members/${colleague.id}/role`, {
      role: 'Member',
      guest: true,
    });
    expect({ denied: denied.status, converted: converted.data }).toMatchObject({
      denied: 409,
      converted: { role: 'Member', roles: ['Member'], ssoRoles: [], guest: true },
    });
  });

  it('preserves guest status when an Owner reduces a guest manual role', async () => {
    const colleague = await createTestUser('colleague@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: colleague.id,
      role: 'Owner',
      guest: true,
    });
    const response = await request.put(`/api/organizations/staff/members/${colleague.id}/role`, {
      role: 'Member',
    });
    expect(response).toMatchObject({
      status: 200,
      data: { role: 'Member', roles: ['Member'], ssoRoles: [], guest: true },
    });
  });

  it.each(['members', 'invites'])(
    'does not let a Maintainer grant Owner access through %s',
    async (endpoint) => {
      await OrganizationMember.update({ role: 'Maintainer' }, { where: { UserId: user.id } });
      await createTestUser('colleague@example.com');
      const grant = { email: 'colleague@example.com', role: 'Owner' };
      const response = await request.post(
        `/api/organizations/staff/${endpoint}`,
        endpoint === 'invites' ? [grant] : grant,
      );
      expect(response).toMatchObject({
        status: 403,
        data: { message: 'User does not have sufficient organization permissions.' },
      });
    },
  );

  it('lets a Maintainer grant a role within their effective permissions', async () => {
    await OrganizationMember.update({ role: 'Maintainer' }, { where: { UserId: user.id } });
    await createTestUser('colleague@example.com');
    const response = await request.post('/api/organizations/staff/members', {
      email: 'colleague@example.com',
      role: 'AppManager',
    });
    expect(response).toMatchObject({
      status: 201,
      data: { roles: ['AppManager'], guest: false },
    });
  });

  it.each(['members', 'invites'])(
    'requires Owner authority to grant a guest exception through %s',
    async (endpoint) => {
      await createTestUser('colleague@example.com');
      const grant = { email: 'colleague@example.com', role: 'Member', guest: true };
      const body = endpoint === 'invites' ? [grant] : grant;
      await OrganizationMember.update({ role: 'Maintainer' }, { where: { UserId: user.id } });
      const maintainer = await request.post(`/api/organizations/staff/${endpoint}`, body);
      await OrganizationMember.update({ role: 'Owner' }, { where: { UserId: user.id } });
      const owner = await request.post(`/api/organizations/staff/${endpoint}`, body);
      expect([maintainer.status, owner.status]).toStrictEqual([403, 201]);
    },
  );

  it('does not orphan managed staff when the provider is removed', async () => {
    await applyOrganizationSsoConfiguration('staff', configuration, 'deployment');
    const colleague = await createTestUser('colleague@example.com');
    await OrganizationMember.create({ OrganizationId: 'staff', UserId: colleague.id, role: null });
    await OrganizationSso.update({ managedBy: 'studio' }, { where: { OrganizationId: 'staff' } });
    const response = await request.delete('/api/organizations/staff/sso');
    expect(response.status).toBe(409);
  });

  it('reconciles mapped Owner grants before a member leaves after mapping changes', async () => {
    const ownerConfiguration: OrganizationSsoConfiguration = {
      ...configuration,
      roleMappings: [
        { group: '/owner-a', role: PredefinedOrganizationRole.Owner },
        { group: '/owner-b', role: PredefinedOrganizationRole.Owner },
      ],
    };
    await signInWithSso(['/owner-a'], ownerConfiguration);
    await request.get('/api/organizations/staff/members');
    const owner = user;
    const { authorization } = request.defaults.headers.common;
    user = await createTestUser('colleague@example.com');
    await OrganizationMember.create({ OrganizationId: 'staff', UserId: user.id, role: null });
    await signInWithSso(['/owner-b'], ownerConfiguration);
    await request.get('/api/organizations/staff/members');
    await applyOrganizationSsoConfiguration(
      'staff',
      {
        ...ownerConfiguration,
        roleMappings: [{ group: '/owner-a', role: PredefinedOrganizationRole.Owner }],
      },
      'deployment',
    );
    request.defaults.headers.common.authorization = authorization;
    const response = await request.delete(`/api/organizations/staff/members/${owner.id}`);
    expect(response).toMatchObject({
      status: 409,
      data: { message: 'An organization must retain at least one Owner.' },
    });
  });

  it.each([false, true])(
    'does not count a dormant guest=%s Owner under required SSO',
    async (guest) => {
      await signInWithSso(['/owners'], {
        ...configuration,
        policy: 'required',
        roleMappings: [{ group: '/owners', role: PredefinedOrganizationRole.Owner }],
      });
      await request.get('/api/organizations/staff/members');
      const colleague = await createTestUser('colleague@example.com');
      await OrganizationMember.create({
        OrganizationId: 'staff',
        UserId: colleague.id,
        role: 'Owner',
        guest,
      });
      const response = await request.delete(`/api/organizations/staff/members/${user.id}`);
      expect(response).toMatchObject({
        status: 409,
        data: { message: 'An organization must retain at least one Owner.' },
      });
    },
  );

  it('allows an active staff Owner to remove a dormant guest Owner', async () => {
    await signInWithSso(['/owners'], {
      ...configuration,
      policy: 'required',
      roleMappings: [{ group: '/owners', role: PredefinedOrganizationRole.Owner }],
    });
    await request.get('/api/organizations/staff/members');
    const colleague = await createTestUser('colleague@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: colleague.id,
      role: 'Owner',
      guest: true,
    });
    const response = await request.delete(`/api/organizations/staff/members/${colleague.id}`);
    expect(response.status).toBe(204);
  });

  it('retains an accessible Owner when staff Owners convert each other to disabled guests', async () => {
    const ownerConfiguration: OrganizationSsoConfiguration = {
      ...configuration,
      policy: 'required-with-guests',
      allowedLoginMethods: [],
      roleMappings: [{ group: '/owners', role: PredefinedOrganizationRole.Owner }],
    };
    await signInWithSso(['/owners'], ownerConfiguration);
    await request.get('/api/organizations/staff/members');
    const firstOwner = user;
    const { authorization: firstAuthorization } = request.defaults.headers.common;
    user = await createTestUser('colleague@example.com');
    await OrganizationMember.create({ OrganizationId: 'staff', UserId: user.id, role: null });
    await signInWithSso(['/owners'], ownerConfiguration);
    await request.get('/api/organizations/staff/members');
    const { authorization: secondAuthorization } = request.defaults.headers.common;
    await Promise.all([
      request.put(
        `/api/organizations/staff/members/${user.id}/role`,
        { role: 'Owner', guest: true },
        { headers: { authorization: firstAuthorization } },
      ),
      request.put(
        `/api/organizations/staff/members/${firstOwner.id}/role`,
        { role: 'Owner', guest: true },
        { headers: { authorization: secondAuthorization } },
      ),
    ]);
    const owners = await Promise.all(
      [firstAuthorization, secondAuthorization].map((authorization) =>
        request.get('/api/organizations/staff/sso', { headers: { authorization } }),
      ),
    );
    expect(owners.map(({ status }) => status).sort()).toStrictEqual([200, 403]);
  });

  it.each([
    { path: '/api/blocks', managed: false },
    { path: '/api/organizations/staff/blocks', managed: false },
    { path: '/api/blocks', managed: true },
    { path: '/api/organizations/staff/blocks', managed: true },
  ])(
    'filters private blocks from $path for inaccessible managed=$managed members',
    async ({ path, managed }) => {
      await BlockVersion.bulkCreate([
        { OrganizationId: 'staff', name: 'private', version: '0.0.0', visibility: 'private' },
        { OrganizationId: 'staff', name: 'public', version: '0.0.0', visibility: 'public' },
      ]);
      await applyOrganizationSsoConfiguration(
        'staff',
        {
          ...configuration,
          policy: managed ? 'optional' : 'required',
        },
        'deployment',
      );
      if (managed) {
        await OrganizationMember.update(
          { role: null, ssoRoles: [] },
          { where: { UserId: user.id } },
        );
      }
      const response = await request.get(path);
      expect(response.data.map(({ name }: { name: string }) => name)).toStrictEqual([
        '@staff/public',
      ]);
    },
  );
});
