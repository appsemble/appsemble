import { createHash } from 'node:crypto';

import { PredefinedOrganizationRole, type TokenResponse } from '@appsemble/types';
import axios, { type AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import { QueryTypes } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAuthorization,
  getDB,
  OAuthAuthorization,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
  type User,
} from '../../../../../../../models/index.js';
import { setArgv } from '../../../../../../../utils/argv.js';
import { createJWTResponse } from '../../../../../../../utils/createJWTResponse.js';
import { createServer } from '../../../../../../../utils/createServer.js';
import { encrypt } from '../../../../../../../utils/crypto.js';
import {
  authorizeClientCredentials,
  createTestUser,
  unauthorize,
} from '../../../../../../../utils/test/authorization.js';

const path = '/api/users/current/auth/oidc/identities';
const issuer = 'https://identity.example.com/realms/staff';
const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
let user: User;
let identity: OrganizationSsoIdentity;
let sso: OrganizationSso;
let source: { session: OrganizationSsoSession; tokens: TokenResponse };

function useTokens(tokens = createJWTResponse(user.id, { loginMethod: 'password' })): void {
  request.defaults.headers.common.authorization = `Bearer ${tokens.access_token}`;
}

async function createSession(
  linkedIdentity: OrganizationSsoIdentity,
  groups = ['/staff'],
  configuration = sso,
): Promise<{ session: OrganizationSsoSession; tokens: TokenResponse }> {
  const session = await OrganizationSsoSession.create({
    OrganizationId: configuration.OrganizationId,
    OrganizationSsoIdentityId: linkedIdentity.id,
    refreshToken: encrypt('provider-refresh-token', 'test-aes-secret'),
    refreshTokenHash: '',
    accessTokenExpires: new Date(Date.now() + 300_000),
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000),
    configurationUpdated: configuration.configurationUpdated,
    groups,
  });
  const tokens = createJWTResponse(user.id, {
    loginMethod: 'oidc',
    organizationSsoSessionId: session.id,
  });
  await session.update({
    refreshTokenHash: createHash('sha256').update(tokens.refresh_token!).digest('hex'),
  });
  return { session, tokens };
}

async function createPersonalCredentials(): Promise<{ id: string; tokens: TokenResponse }> {
  const { data } = await request.post('/api/users/current/auth/oauth2/client-credentials', {
    description: 'Personal publishing credentials',
    scopes: ['organizations:write'],
  });
  const token = await request.post(
    '/auth/oauth2/token',
    'grant_type=client_credentials&scope=organizations%3Awrite',
    {
      auth: { username: data.id, password: data.secret },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
  );
  expect(token.status).toBe(200);
  return { id: data.id as string, tokens: token.data as TokenResponse };
}

describe('current account organization OIDC identities', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test-aes-secret' });
    await setTestApp(await createServer());
    user = await createTestUser();
    await Organization.create({ id: 'staff', name: 'Staff' });
    sso = await OrganizationSso.create({
      OrganizationId: 'staff',
      issuer,
      clientId: 'studio',
      clientSecret: encrypt('provider-secret', 'test-aes-secret'),
      name: 'Staff',
      scope: 'openid',
      groupClaim: 'groups',
      roleMappings: [
        { group: '/staff', role: PredefinedOrganizationRole.Member },
        { group: '/owners', role: PredefinedOrganizationRole.Owner },
      ],
      policy: 'optional',
      managedBy: 'deployment',
      allowedLoginMethods: ['password', 'oidc'],
      configurationUpdated: new Date(),
    });
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: user.id,
      role: null,
      ssoRoles: [PredefinedOrganizationRole.Member],
    });
    identity = await OrganizationSsoIdentity.create({ UserId: user.id, issuer, subject: 'staff' });
    source = await createSession(identity);
    useTokens();
  });

  afterEach(() => {
    mock.reset();
  });

  it('lists only the account identities in private responses that cannot be cached', async () => {
    const otherUser = await createTestUser('other@example.com');
    await OrganizationSsoIdentity.create({ UserId: otherUser.id, issuer, subject: 'other' });
    await Organization.create({ id: 'other', name: 'Other' });
    await OrganizationSso.create({ ...sso.get({ plain: true }), OrganizationId: 'other' });
    const response = await request.get(path);
    expect({
      status: response.status,
      cache: response.headers['cache-control'],
      data: response.data,
    }).toStrictEqual({
      status: 200,
      cache: 'private, no-store',
      data: [
        {
          id: identity.id,
          issuer,
          subject: 'staff',
          username: null,
          organizations: [{ id: 'staff', name: 'Staff', provider: 'Staff' }],
        },
      ],
    });
  });

  it('omits deleted organizations from the listed identities', async () => {
    await Organization.create({ id: 'deleted', name: 'Deleted' });
    await OrganizationSso.create({ ...sso.get({ plain: true }), OrganizationId: 'deleted' });
    await OrganizationMember.create({
      OrganizationId: 'deleted',
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    const deleted = await request.delete('/api/organizations/deleted');
    const response = await request.get(path);
    expect({ deleted: deleted.status, status: response.status, data: response.data }).toStrictEqual(
      {
        deleted: 200,
        status: 200,
        data: [
          {
            id: identity.id,
            issuer,
            subject: 'staff',
            username: null,
            organizations: [{ id: 'staff', name: 'Staff', provider: 'Staff' }],
          },
        ],
      },
    );
  });

  it('requires an interactive account session for listing and unlinking', async () => {
    unauthorize();
    const anonymous = await request.get(path);
    await authorizeClientCredentials('organizations:write', user);
    const cliList = await request.get(path);
    const cliDelete = await request.delete(`${path}/${identity.id}`);
    expect([anonymous.status, cliList.status, cliDelete.status]).toStrictEqual([401, 401, 401]);
  });

  it('does not disclose or unlink an identity belonging to another account', async () => {
    const otherUser = await createTestUser('other@example.com');
    const other = await OrganizationSsoIdentity.create({
      UserId: otherUser.id,
      issuer,
      subject: 'other',
    });
    const deleted = await request.delete(`${path}/${other.id}`);
    useTokens(createJWTResponse(otherUser.id, { loginMethod: 'password' }));
    const list = await request.get(path);
    expect({ status: deleted.status, identities: list.data }).toStrictEqual({
      status: 404,
      identities: [{ id: other.id, issuer, subject: 'other', username: null, organizations: [] }],
    });
  });

  it('requires signing in again before unlinking', async () => {
    useTokens(
      createJWTResponse(user.id, {
        loginMethod: 'password',
        authTime: Math.floor(Date.now() / 1000) - 601,
      }),
    );
    expect((await request.delete(`${path}/${identity.id}`)).status).toBe(403);
  });

  it.each(['no recovery', 'unverified email', 'another organization identity'])(
    'preserves the connection when only %s remains',
    async (recovery) => {
      await EmailAuthorization.destroy({ where: { UserId: user.id } });
      if (recovery === 'unverified email') {
        await EmailAuthorization.create({
          UserId: user.id,
          email: 'pending@example.com',
          verified: false,
        });
      } else if (recovery === 'another organization identity') {
        await OrganizationSsoIdentity.create({ UserId: user.id, issuer, subject: 'second' });
      }
      useTokens(source.tokens);
      const deleted = await request.delete(`${path}/${identity.id}`);
      const current = await request.get('/api/users/current');
      expect({ deletion: deleted.status, current: current.status }).toStrictEqual({
        deletion: 409,
        current: 200,
      });
    },
  );

  it('accepts a personal social login as independent recovery', async () => {
    await EmailAuthorization.destroy({ where: { UserId: user.id } });
    await OAuthAuthorization.create({
      UserId: user.id,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
      sub: 'personal',
      accessToken: '',
      email: '',
    });
    expect((await request.delete(`${path}/${identity.id}`)).data).toStrictEqual({
      sessionRevoked: false,
    });
  });

  it('revokes the selected connection sessions and derived credentials while retaining other connections', async () => {
    useTokens(source.tokens);
    const revokedCredentials = await createPersonalCredentials();
    const other = await OrganizationSsoIdentity.create({
      UserId: user.id,
      issuer,
      subject: 'second',
    });
    const retained = await createSession(other);
    useTokens(retained.tokens);
    const retainedCredentials = await createPersonalCredentials();
    useTokens(source.tokens);
    const before = await request.get('/api/users/current');
    const deleted = await request.delete(`${path}/${identity.id}`);
    const access = await request.get('/api/users/current');
    const refresh = await request.post('/api/auth/refresh-token', {
      refresh_token: source.tokens.refresh_token,
    });
    useTokens(revokedCredentials.tokens);
    const cli = await request.get('/api/organizations/staff/members');
    useTokens(retained.tokens);
    const current = await request.get('/api/users/current');
    const identities = await request.get(path);
    const credentials = await request.get('/api/users/current/auth/oauth2/client-credentials');
    expect({
      before: before.status,
      deleted: deleted.data,
      access: access.status,
      refresh: refresh.status,
      cli: cli.status,
      retained: current.status,
      identities: identities.data,
      credentials: credentials.data.map(({ id }: { id: string }) => id),
    }).toStrictEqual({
      before: 200,
      deleted: { sessionRevoked: true },
      access: 401,
      refresh: 401,
      cli: 401,
      retained: 200,
      identities: [
        {
          id: other.id,
          issuer,
          subject: 'second',
          username: null,
          organizations: [{ id: 'staff', name: 'Staff', provider: 'Staff' }],
        },
      ],
      credentials: [retainedCredentials.id],
    });
  });

  it('preserves manual and guest memberships when unlinking', async () => {
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Owner, ssoRoles: [] },
      { where: { OrganizationId: 'staff', UserId: user.id } },
    );
    await Organization.create({ id: 'guests', name: 'Guests' });
    await OrganizationMember.create({
      OrganizationId: 'guests',
      UserId: user.id,
      role: PredefinedOrganizationRole.Member,
      guest: true,
    });
    const deleted = await request.delete(`${path}/${identity.id}`);
    const organizations = await request.get('/api/users/current/organizations');
    expect({
      deleted: deleted.data,
      memberships: organizations.data
        .map(({ id, role, guest }: { id: string; role: string; guest: boolean }) => ({
          id,
          role,
          guest,
        }))
        .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)),
    }).toStrictEqual({
      deleted: { sessionRevoked: false },
      memberships: [
        { id: 'guests', role: 'Member', guest: true },
        { id: 'staff', role: 'Owner', guest: false },
      ],
    });
  });

  it.each([
    { guest: false, policy: 'optional' },
    { guest: true, policy: 'required-with-guests' },
  ] as const)(
    'preserves the last guest=$guest Owner whose only permitted login is organization SSO',
    async ({ guest, policy }) => {
      await sso.update({ policy, allowedLoginMethods: ['oidc'] });
      await OrganizationMember.update(
        { role: PredefinedOrganizationRole.Owner, guest, ssoRoles: [] },
        { where: { OrganizationId: 'staff', UserId: user.id } },
      );
      useTokens(source.tokens);
      const before = await request.get('/api/organizations/staff/sso');
      const deleted = await request.delete(`${path}/${identity.id}`);
      const after = await request.get('/api/organizations/staff/sso');
      expect({ before: before.status, deleted: deleted.status, after: after.status }).toStrictEqual(
        { before: 200, deleted: 409, after: 200 },
      );
    },
  );

  it('keeps another organization connection as the manual Owner login route', async () => {
    await sso.update({ allowedLoginMethods: ['oidc'] });
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Owner, ssoRoles: [] },
      { where: { OrganizationId: 'staff', UserId: user.id } },
    );
    const other = await OrganizationSsoIdentity.create({
      UserId: user.id,
      issuer,
      subject: 'second',
    });
    const retained = await createSession(other);
    useTokens(source.tokens);
    const deleted = await request.delete(`${path}/${identity.id}`);
    useTokens(retained.tokens);
    const settings = await request.get('/api/organizations/staff/sso');
    expect({ deleted: deleted.status, settings: settings.status }).toStrictEqual({
      deleted: 200,
      settings: 200,
    });
  });

  it.each([false, true])(
    'treats remaining unmapped groups as an Owner login route only for guest=%s',
    async (guest) => {
      await sso.update({
        policy: guest ? 'required-with-guests' : 'optional',
        allowedLoginMethods: ['oidc'],
      });
      await OrganizationMember.update(
        { role: PredefinedOrganizationRole.Owner, guest, ssoRoles: [] },
        { where: { OrganizationId: 'staff', UserId: user.id } },
      );
      const other = await OrganizationSsoIdentity.create({
        UserId: user.id,
        issuer,
        subject: 'second',
      });
      const retained = await createSession(other, []);
      useTokens(source.tokens);
      const deleted = await request.delete(`${path}/${identity.id}`);
      useTokens(guest ? retained.tokens : source.tokens);
      const settings = await request.get('/api/organizations/staff/sso');
      expect({ deleted: deleted.status, settings: settings.status }).toStrictEqual({
        deleted: guest ? 200 : 409,
        settings: 200,
      });
    },
  );

  it('preserves the last usable Owner and rolls back the unlink', async () => {
    await source.session.update({ groups: ['/owners'] });
    await OrganizationMember.update(
      { ssoRoles: [PredefinedOrganizationRole.Owner] },
      { where: { OrganizationId: 'staff', UserId: user.id } },
    );
    useTokens(source.tokens);
    const deleted = await request.delete(`${path}/${identity.id}`);
    const members = await request.get('/api/organizations/staff/members');
    expect({ deletion: deleted.status, members: members.status }).toStrictEqual({
      deletion: 409,
      members: 200,
    });
  });

  it('clears another connection Owner grant while preserving the current Studio session', async () => {
    const other = await OrganizationSsoIdentity.create({
      UserId: user.id,
      issuer,
      subject: 'second',
    });
    const selected = await createSession(other, ['/owners']);
    useTokens(selected.tokens);
    await request.get('/api/users/current/organizations');
    const owner = await createTestUser('owner@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: owner.id,
      role: PredefinedOrganizationRole.Owner,
    });
    useTokens(source.tokens);
    const deleted = await request.delete(`${path}/${other.id}`);
    const organizations = await request.get('/api/users/current/organizations');
    useTokens(selected.tokens);
    const revoked = await request.get('/api/users/current');
    expect({
      deletion: deleted.data,
      memberships: organizations.data.map(({ id, roles }: { id: string; roles: string[] }) => ({
        id,
        roles,
      })),
      selected: revoked.status,
    }).toStrictEqual({
      deletion: { sessionRevoked: false },
      memberships: [{ id: 'staff', roles: ['Member'] }],
      selected: 401,
    });
  });

  it('does not count an expired Owner connection without personal credentials as recovery', async () => {
    await source.session.update({ groups: ['/owners'] });
    const other = await OrganizationSsoIdentity.create({
      UserId: user.id,
      issuer,
      subject: 'second',
    });
    const expired = await createSession(other, ['/owners']);
    await expired.session.update({ expires: new Date(0) });
    await OrganizationMember.update(
      { ssoRoles: [PredefinedOrganizationRole.Owner] },
      { where: { OrganizationId: 'staff', UserId: user.id } },
    );
    expect((await request.delete(`${path}/${identity.id}`)).status).toBe(409);
  });

  it.each([false, true])(
    'preserves usable ownership when the current membership cache is Member and another Owner exists=%s',
    async (hasOtherOwner) => {
      const other = await OrganizationSsoIdentity.create({
        UserId: user.id,
        issuer,
        subject: 'second',
      });
      await createSession(other, ['/owners']);
      if (hasOtherOwner) {
        const owner = await createTestUser('owner@example.com');
        await OrganizationMember.create({
          OrganizationId: 'staff',
          UserId: owner.id,
          role: PredefinedOrganizationRole.Owner,
        });
      }
      useTokens(source.tokens);
      const deleted = await request.delete(`${path}/${other.id}`);
      expect({
        status: deleted.status,
        data: deleted.status === 200 ? deleted.data : null,
      }).toStrictEqual({
        status: hasOtherOwner ? 200 : 409,
        data: hasOtherOwner ? { sessionRevoked: false } : null,
      });
    },
  );

  it('retains every organization session when unlinking would remove an Owner elsewhere', async () => {
    await Organization.create({ id: 'z-last-owner', name: 'Last Owner' });
    const secondConfiguration = await OrganizationSso.create({
      ...sso.get(),
      OrganizationId: 'z-last-owner',
    });
    await OrganizationMember.create({
      OrganizationId: 'z-last-owner',
      UserId: user.id,
      role: null,
      ssoRoles: [PredefinedOrganizationRole.Owner],
    });
    const secondSource = await createSession(identity, ['/owners'], secondConfiguration);
    const deleted = await request.delete(`${path}/${identity.id}`);
    useTokens(source.tokens);
    const first = await request.get('/api/users/current/organizations');
    useTokens(secondSource.tokens);
    const second = await request.get('/api/organizations/z-last-owner/members');
    expect({
      deletion: deleted.status,
      first: first.data.map(({ id }: { id: string }) => id),
      second: second.status,
    }).toStrictEqual({ deletion: 409, first: ['staff'], second: 200 });
  });

  it('retains Owner access backed by another identity and renewable personal credentials', async () => {
    const other = await OrganizationSsoIdentity.create({
      UserId: user.id,
      issuer,
      subject: 'second',
    });
    const retained = await createSession(other, ['/owners']);
    useTokens(retained.tokens);
    const credentials = await createPersonalCredentials();
    await retained.session.update({
      interactiveRevoked: true,
      expires: new Date(0),
      accessTokenExpires: new Date(0),
    });
    await OrganizationMember.update(
      { ssoRoles: [PredefinedOrganizationRole.Owner] },
      { where: { OrganizationId: 'staff', UserId: user.id } },
    );
    useTokens(source.tokens);
    const deleted = await request.delete(`${path}/${identity.id}`);
    const headers = { 'content-type': 'application/json' };
    mock.onGet(`${issuer}/.well-known/openid-configuration`).reply(
      200,
      JSON.stringify({
        issuer,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        authorization_endpoint: `${issuer}/authorize`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_endpoint: `${issuer}/token`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        userinfo_endpoint: `${issuer}/userinfo`,
      }),
      headers,
    );
    mock.onPost(`${issuer}/token`).reply(({ data }) => [
      new URLSearchParams(data).get('refresh_token') === 'provider-refresh-token' ? 200 : 400,
      JSON.stringify({
        access_token: 'retained-owner',
        refresh_token: 'renewed-provider-token',
        token_type: 'Bearer',
        expires_in: 300,
      }),
      headers,
    ]);
    mock
      .onGet(`${issuer}/userinfo`)
      .reply(200, JSON.stringify({ sub: 'second', groups: ['/owners'] }), headers);
    useTokens(credentials.tokens);
    const access = await request.get('/api/organizations/staff/members');
    useTokens();
    const listed = await request.get('/api/users/current/auth/oauth2/client-credentials');
    expect({
      deletion: deleted.status,
      session: deleted.data,
      access: access.status,
      credentials: listed.data.map(({ id }: { id: string }) => id),
    }).toStrictEqual({
      deletion: 200,
      session: { sessionRevoked: true },
      access: 200,
      credentials: [credentials.id],
    });
  });

  it('clears group-managed roles after the source sessions have already been cleaned', async () => {
    await source.session.destroy();
    const owner = await createTestUser('owner@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: owner.id,
      role: PredefinedOrganizationRole.Owner,
    });
    const deleted = await request.delete(`${path}/${identity.id}`);
    useTokens(createJWTResponse(owner.id, { loginMethod: 'password' }));
    const members = await request.get('/api/organizations/staff/members');
    expect({
      deletion: deleted.status,
      member: members.data
        .filter(({ id }: { id: string }) => id === user.id)
        .map(({ roles }: { roles: string[] }) => roles),
    }).toStrictEqual({ deletion: 200, member: [[]] });
  });

  it('does not restore a removed identity grant from an in-flight organization request', async () => {
    await source.session.update({ groups: ['/owners'] });
    const other = await OrganizationSsoIdentity.create({
      UserId: user.id,
      issuer,
      subject: 'second',
    });
    await createSession(other);
    const owner = await createTestUser('owner@example.com');
    await OrganizationMember.create({
      OrganizationId: 'staff',
      UserId: owner.id,
      role: PredefinedOrganizationRole.Owner,
    });
    const barrier = await getDB().transaction();
    await getDB().query('SELECT pg_advisory_xact_lock(hashtext(:issuer), hashtext(:subject))', {
      replacements: { issuer, subject: identity.subject },
      transaction: barrier,
    });
    const deleted = request.delete(`${path}/${identity.id}`);
    let protectedRequest: Promise<AxiosResponse>;
    try {
      await vi.waitUntil(async () => {
        const [{ count }] = await getDB().query<{ count: number }>(
          `SELECT count(*)::integer FROM pg_stat_activity WHERE datname = current_database() AND wait_event = 'advisory'`,
          { type: QueryTypes.SELECT },
        );
        return count === 1;
      });
      protectedRequest = request.get('/api/users/current/organizations', {
        headers: { authorization: `Bearer ${source.tokens.access_token}` },
      });
      await vi.waitUntil(async () => {
        const [{ count }] = await getDB().query<{ count: number }>(
          `SELECT count(*)::integer FROM pg_stat_activity WHERE datname = current_database() AND wait_event = 'advisory'`,
          { type: QueryTypes.SELECT },
        );
        return count === 2;
      });
    } finally {
      await barrier.rollback();
    }
    const [unlink, accessed] = await Promise.all([deleted, protectedRequest!]);
    useTokens(createJWTResponse(owner.id, { loginMethod: 'password' }));
    const members = await request.get('/api/organizations/staff/members');
    expect({
      unlink: unlink.status,
      accessed: accessed.data,
      member: members.data
        .filter(({ id }: { id: string }) => id === user.id)
        .map(({ roles }: { roles: string[] }) => roles),
    }).toStrictEqual({ unlink: 200, accessed: [], member: [['Member']] });
  });
});
