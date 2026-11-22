import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

import {
  type OrganizationSsoConfiguration,
  PredefinedOrganizationRole,
  type TokenResponse,
} from '@appsemble/types';
import axios, { type AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDB,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
  User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { decrypt, encrypt } from '../../../utils/crypto.js';
import { applyOrganizationSsoConfiguration } from '../../../utils/organizationSso.js';
import { authorizeStudio, createTestUser, unauthorize } from '../../../utils/test/authorization.js';

const issuer = 'https://idp.example/realms/staff';
const origin = 'http://localhost';
const path = '/api/organizations/staff/sso';
const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
let nonce: string;
let groups: string[];
let claims: Record<string, unknown>;
let challenges: Map<string, string>;
let redeemed: Set<string>;
let providerGrants: Map<string, { current: string; revoked: boolean }>;
let providerLifetime: number | undefined;
let providerUnavailable: boolean;
let providerGrantRevoked: boolean;
let acceptedClientSecret: string;
let configuration: OrganizationSsoConfiguration;
let userInfoClaims: Record<string, unknown>;
let includeIdToken: boolean;
let beforeTokenResponse: (() => Promise<void>) | undefined;

function mockProvider(expiredRefreshToken?: string): void {
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      jwks_uri: `${issuer}/jwks`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_types_supported: ['code'],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      id_token_signing_alg_values_supported: ['RS256'],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      authorization_response_iss_parameter_supported: true,
    }),
    headers,
  );
  mock
    .onGet(`${issuer}/jwks`)
    .reply(
      200,
      JSON.stringify({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'signing-key' }] }),
      headers,
    );
  mock.onPost(`${issuer}/token`).reply(async (config) => {
    await beforeTokenResponse?.();
    const parameters = new URLSearchParams(config.data);
    if (providerUnavailable) {
      return [503, JSON.stringify({ error: 'temporarily_unavailable' }), headers];
    }
    if (providerGrantRevoked || parameters.get('refresh_token') === expiredRefreshToken) {
      return [400, JSON.stringify({ error: 'invalid_grant' }), headers];
    }
    if (parameters.get('client_secret') !== acceptedClientSecret) {
      return [401, JSON.stringify({ error: 'invalid_client' }), headers];
    }
    if (parameters.get('grant_type') === 'authorization_code') {
      const code = parameters.get('code')!;
      const challenge = createHash('sha256')
        .update(parameters.get('code_verifier')!)
        .digest('base64url');
      if (redeemed.has(code) || challenges.get(code) !== challenge) {
        return [400, JSON.stringify({ error: 'invalid_grant' }), headers];
      }
      redeemed.add(code);
    }
    const previousRefreshToken = parameters.get('refresh_token');
    const grant = previousRefreshToken
      ? providerGrants.get(previousRefreshToken)
      : { current: '', revoked: false };
    if (!grant || grant.revoked) {
      return [400, JSON.stringify({ error: 'invalid_grant' }), headers];
    }
    if (previousRefreshToken && grant.current !== previousRefreshToken) {
      grant.revoked = true;
      return [400, JSON.stringify({ error: 'invalid_grant' }), headers];
    }
    grant.current = randomUUID();
    providerGrants.set(grant.current, grant);
    return [
      200,
      JSON.stringify({
        access_token: 'provider-access-token',
        refresh_token: grant.current,
        token_type: 'Bearer',
        expires_in: providerLifetime,
        id_token: includeIdToken
          ? jwt.sign(
              {
                iss: issuer,
                aud: 'studio-client',
                sub: 'staff-subject',
                groups,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                auth_time: Math.floor(Date.now() / 1000),
                nonce,
                exp: Math.floor(Date.now() / 1000) + 300,
                ...claims,
              },
              privateKey,
              { algorithm: 'RS256', keyid: 'signing-key' },
            )
          : undefined,
      }),
      headers,
    ];
  });
  mock.onGet(`${issuer}/userinfo`).reply(() => [
    200,
    JSON.stringify({
      sub: 'staff-subject',
      email: 'staff@example.com',
      email_verified: true,
      name: 'Staff Member',
      groups,
      ...userInfoClaims,
    }),
    headers,
  ]);
}

async function begin(
  link = false,
  candidate?: OrganizationSsoConfiguration,
): Promise<{ state: string; cookie: string }> {
  const response = await request.post(
    `${path}/login`,
    { link, ...(candidate ? { configuration: candidate } : {}) },
    { headers: { origin } },
  );
  expect(response.status).toBe(200);
  const url = new URL(response.data.authorizationUrl);
  nonce = url.searchParams.get('nonce')!;
  challenges.set(url.searchParams.get('state')!, url.searchParams.get('code_challenge')!);
  return {
    state: url.searchParams.get('state')!,
    cookie: response.headers['set-cookie']!.map((value: string) => value.split(';')[0]).join('; '),
  };
}

function complete(flow: { state: string; cookie: string }): Promise<AxiosResponse> {
  return request.post(
    `${path}/callback`,
    { code: flow.state, state: flow.state, iss: issuer, timezone: 'Europe/Amsterdam' },
    { headers: { origin, cookie: flow.cookie } },
  );
}

async function signIn(): Promise<TokenResponse> {
  const response = await complete(await begin());
  expect(response).toMatchObject({
    status: 200,
    headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
  });
  request.defaults.headers.common.authorization = `Bearer ${response.data.access_token}`;
  return response.data as TokenResponse;
}

async function signInAsOwner(): Promise<TokenResponse> {
  groups = ['/staff/owners'];
  configuration = {
    ...configuration,
    roleMappings: [{ group: '/staff/owners', role: PredefinedOrganizationRole.Owner }],
  };
  await OrganizationSso.update(
    { roleMappings: configuration.roleMappings },
    { where: { OrganizationId: 'staff' } },
  );
  return signIn();
}

async function createPersonalCredentials(): Promise<{
  id: string;
  secret: string;
  accessToken: string;
}> {
  const credentials = await request.post('/api/users/current/auth/oauth2/client-credentials', {
    description: 'Personal publishing credentials',
    scopes: ['organizations:write'],
  });
  expect(credentials.status).toBe(201);
  const token = await request.post(
    '/auth/oauth2/token',
    'grant_type=client_credentials&scope=organizations%3Awrite',
    {
      auth: { username: credentials.data.id, password: credentials.data.secret },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
  );
  expect(token).toMatchObject({
    status: 200,
    headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
  });
  return {
    id: credentials.data.id,
    secret: credentials.data.secret,
    accessToken: token.data.access_token,
  };
}

describe('organization OIDC sign-in', () => {
  beforeEach(async () => {
    setArgv({
      host: origin,
      secret: 'test',
      aesSecret: 'test-aes-secret',
      organizationSsoIssuers: issuer,
    });
    await setTestApp(await createServer());
    await Organization.create({ id: 'staff', name: 'Staff' });
    configuration = {
      issuer,
      clientId: 'studio-client',
      clientSecret: 'provider-secret',
      name: 'Staff SSO',
      scope: 'openid email profile',
      groupClaim: 'groups',
      roleMappings: [
        { group: '/staff/translators', role: PredefinedOrganizationRole.AppTranslator },
        { group: '/staff/content', role: PredefinedOrganizationRole.AppContentsManager },
      ],
      policy: 'required',
      allowedLoginMethods: ['oidc'],
    };
    await OrganizationSso.create({
      ...configuration,
      OrganizationId: 'staff',
      clientSecret: encrypt(configuration.clientSecret!, 'test-aes-secret'),
      managedBy: 'studio',
      configurationUpdated: new Date(),
    });
    groups = ['/staff/translators', '/staff/content'];
    claims = {};
    challenges = new Map();
    redeemed = new Set();
    providerGrants = new Map();
    providerLifetime = 300;
    providerUnavailable = false;
    providerGrantRevoked = false;
    acceptedClientSecret = 'provider-secret';
    userInfoClaims = {};
    includeIdToken = true;
    beforeTokenResponse = undefined;
    mockProvider();
  });

  afterEach(() => {
    mock.reset();
    vi.useRealTimers();
  });

  it('grants the combined organization roles from trusted provider groups', async () => {
    await signIn();
    const response = await request.get('/api/users/current/organizations');
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: 'staff',
          roles: [
            PredefinedOrganizationRole.AppTranslator,
            PredefinedOrganizationRole.AppContentsManager,
          ],
        },
      ],
    });
  });

  it('keeps an Owner when manual Owners adopt group-managed access concurrently', async () => {
    const first = await signIn();
    unauthorize();
    claims = { sub: 'second-staff-subject' };
    userInfoClaims = { sub: 'second-staff-subject', email: 'second@example.com' };
    const second = await signIn();
    await OrganizationSso.update(
      { policy: 'optional', allowedLoginMethods: ['password', 'oidc'] },
      { where: { OrganizationId: 'staff' } },
    );
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Owner },
      { where: { OrganizationId: 'staff' } },
    );

    const transaction = await getDB().transaction();
    await OrganizationMember.findAll({
      where: { OrganizationId: 'staff' },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const requests = [first, second].map((tokens) =>
      request.get('/api/users/current/organizations', {
        headers: { authorization: `Bearer ${tokens.access_token}` },
      }),
    );
    try {
      await vi.waitUntil(async () => {
        const [{ count }] = await getDB().query<{ count: number }>(
          `SELECT count(*)::integer FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'`,
          { type: QueryTypes.SELECT },
        );
        return count === 2;
      });
    } finally {
      await transaction.rollback();
    }
    const responses = await Promise.all(requests);

    expect(responses.map(({ data }) => data[0].roles)).toContainEqual([
      PredefinedOrganizationRole.Owner,
    ]);
  });

  it.each([
    ['another issuer', { iss: 'https://idp.example/realms/other' }],
    ['another audience', { aud: 'another-client' }],
    ['an expired token', { exp: 1 }],
    ['another nonce', { nonce: 'another-browser' }],
    ['a missing subject', { sub: undefined }],
  ] as const)('rejects %s before granting access', async (description, overrides) => {
    const flow = await begin();
    claims = overrides;
    const response = await complete(flow);
    expect(response.status).toBe(401);
    expect((await request.get('/api/users/current/organizations')).status).toBe(401);
  });

  it('rejects a callback from a different browser', async () => {
    const flow = await begin();
    const response = await complete({ ...flow, cookie: '' });
    expect(response.status).toBe(401);
  });

  it('rejects a callback with another state', async () => {
    const flow = await begin();
    const response = await complete({ ...flow, state: 'another-state' });
    expect(response.status).toBe(401);
  });

  it.each([
    ['origin', { origin: 'https://attacker.example' }],
    ['referer', { referer: 'https://attacker.example/sign-in' }],
  ])('rejects starting sign-in from another %s', async (header, headers) => {
    const response = await request.post(`${path}/login`, { link: false }, { headers });
    expect(response.status).toBe(403);
  });

  it('rejects completing sign-in from another origin', async () => {
    const flow = await begin();
    const response = await request.post(
      `${path}/callback`,
      { code: flow.state, state: flow.state, iss: issuer, timezone: 'Europe/Amsterdam' },
      { headers: { origin: 'https://attacker.example', cookie: flow.cookie } },
    );
    expect(response.status).toBe(403);
  });

  it('rejects an ID token signed by a different key', async () => {
    const { publicKey: otherKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    mock
      .onGet(`${issuer}/jwks`)
      .reply(
        200,
        JSON.stringify({ keys: [{ ...otherKey.export({ format: 'jwk' }), kid: 'signing-key' }] }),
        { 'content-type': 'application/json' },
      );
    expect((await complete(await begin())).status).toBe(401);
  });

  it('requires an authentication time for explicit account linking', async () => {
    const user = await createTestUser('staff@example.com');
    authorizeStudio(user);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    claims = { auth_time: undefined };
    expect((await complete(await begin(true))).status).toBe(401);
  });

  it('does not treat a login without an authentication time as recent factor proof', async () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    claims = { auth_time: undefined };
    const tokens = await signIn();
    expect((jwt.decode(tokens.access_token) as jwt.JwtPayload).authTime).toBe(0);
  });

  it('rejects a provider access token without an expiry', async () => {
    providerLifetime = undefined;
    expect((await complete(await begin())).status).toBe(401);
  });

  it('requires an ID token when signing in through the organization provider', async () => {
    includeIdToken = false;
    expect((await complete(await begin())).status).toBe(401);
  });

  it('rejects user information for another subject', async () => {
    mock.onGet(`${issuer}/userinfo`).reply(200, JSON.stringify({ sub: 'another-person' }), {
      'content-type': 'application/json',
    });
    expect((await complete(await begin())).status).toBe(401);
  });

  it('rejects replaying the same provider authorization code', async () => {
    const flow = await begin();
    expect((await complete(flow)).status).toBe(200);
    expect((await complete(flow)).status).toBe(401);
  });

  it('stops sign-in and renewal through a Studio provider whose issuer is no longer allowed', async () => {
    await signIn();
    const flow = await begin();
    setArgv({ host: origin, secret: 'test', aesSecret: 'test-aes-secret' });
    expect((await complete(flow)).status).toBe(401);
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
  });

  it('signs in through a deployment-managed provider without an installation allowance', async () => {
    setArgv({ host: origin, secret: 'test', aesSecret: 'test-aes-secret' });
    await OrganizationSso.update(
      { managedBy: 'deployment' },
      { where: { OrganizationId: 'staff' } },
    );
    expect((await complete(await begin())).status).toBe(200);
  });

  it('stops sign-in through the provider of a deleted organization', async () => {
    const owner = await signInAsOwner();
    unauthorize();
    claims = { sub: 'new-staff-subject' };
    userInfoClaims = { sub: 'new-staff-subject', email: 'new@example.com' };
    const flow = await begin();
    const deletion = await request.delete('/api/organizations/staff', {
      headers: { authorization: `Bearer ${owner.access_token}` },
    });
    expect(deletion.status).toBe(200);

    expect((await request.get(`${path}/login`)).status).toBe(404);
    expect((await request.post(`${path}/login`, {}, { headers: { origin } })).status).toBe(404);
    expect((await complete(flow)).status).toBe(404);
    expect(await User.count({ where: { primaryEmail: 'new@example.com' } })).toBe(0);
    expect(await OrganizationMember.count({ where: { OrganizationId: 'staff' } })).toBe(1);
  });

  it('does not grant access when no group maps to an organization role', async () => {
    groups = ['/other-organization/staff'];
    const response = await complete(await begin());
    expect(response.status).toBe(403);
  });

  it('grants a mapped role only for the exact provider group', async () => {
    groups = ['/staff', '/staff/translators/extra', '/staff/content-extra'];
    const response = await complete(await begin());
    expect(response.status).toBe(403);
  });

  it.each([
    { policy: 'required', allowedLoginMethods: ['oidc'], status: 403 },
    { policy: 'required-with-guests', allowedLoginMethods: ['password'], status: 403 },
    { policy: 'required-with-guests', allowedLoginMethods: ['oidc'], status: 200 },
  ] as const)(
    'returns $status to a guest signing in under $policy with $allowedLoginMethods',
    async ({ allowedLoginMethods, policy, status }) => {
      const guest = await createTestUser('staff@example.com');
      await OrganizationMember.create({
        OrganizationId: 'staff',
        UserId: guest.id,
        role: PredefinedOrganizationRole.Member,
        guest: true,
      });
      await OrganizationSso.update(
        { policy, allowedLoginMethods: [...allowedLoginMethods] },
        { where: { OrganizationId: 'staff' } },
      );
      groups = [];
      authorizeStudio(guest);
      expect((await complete(await begin(true))).status).toBe(status);
    },
  );

  it('requires explicit authenticated linking when the email already belongs to an account', async () => {
    const user = await createTestUser('staff@example.com');
    const collision = await complete(await begin());
    expect(collision.status).toBe(409);
    authorizeStudio(user);
    const linked = await complete(await begin(true));
    expect(linked.status).toBe(200);
    request.defaults.headers.common.authorization = `Bearer ${linked.data.access_token}`;
    const current = await request.get('/api/users/current');
    expect(current.data.sub).toBe(user.id);
  });

  it('does not restore an account connection unlinked while sign-in is completing', async () => {
    const tokens = await signIn();
    const identity = (await OrganizationSsoIdentity.findOne({
      where: { issuer, subject: 'staff-subject' },
    }))!;
    const user = (await User.findByPk(identity.UserId))!;
    const flow = await begin(true);
    const barrier = await getDB().transaction();
    await getDB().query('SELECT pg_advisory_xact_lock(hashtext(:issuer), hashtext(:subject))', {
      replacements: { issuer, subject: identity.subject },
      transaction: barrier,
    });
    const deleted = request.delete(`/api/users/current/auth/oidc/identities/${identity.id}`);
    let callback: Promise<AxiosResponse>;
    try {
      await vi.waitUntil(async () => {
        const [{ count }] = await getDB().query<{ count: number }>(
          `SELECT count(*)::integer FROM pg_stat_activity WHERE datname = current_database() AND wait_event = 'advisory'`,
          { type: QueryTypes.SELECT },
        );
        return count === 1;
      });
      callback = complete(flow);
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
    const [unlink, completed] = await Promise.all([deleted, callback!]);
    request.defaults.headers.common.authorization = `Bearer ${tokens.access_token}`;
    const revoked = await request.get('/api/users/current');
    authorizeStudio(user);
    const identities = await request.get('/api/users/current/auth/oidc/identities');
    expect({
      unlink: unlink.status,
      completed: completed.status,
      revoked: revoked.status,
      identities: identities.data,
    }).toStrictEqual({ unlink: 200, completed: 409, revoked: 401, identities: [] });
  });

  it.each(['connection', 'role mappings'])(
    'rejects completing sign-in after its %s change',
    async (change) => {
      let entered!: () => void;
      const requested = new Promise<void>((resolve) => {
        entered = resolve;
      });
      let release!: () => void;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      beforeTokenResponse = () => {
        entered();
        return released;
      };
      const callback = complete(await begin());
      try {
        await requested;
        await applyOrganizationSsoConfiguration(
          'staff',
          {
            ...configuration,
            ...(change === 'connection' ? { groupClaim: 'new-groups' } : { roleMappings: [] }),
          },
          'deployment',
        );
      } finally {
        release();
      }
      expect((await callback).status).toBe(change === 'connection' ? 401 : 403);
    },
  );

  it('completes linking only for the account which started it', async () => {
    authorizeStudio(await createTestUser('staff@example.com'));
    const flow = await begin(true);
    authorizeStudio(await createTestUser('other@example.com'));
    expect((await complete(flow)).status).toBe(401);
  });

  it('does not link an identity which belongs to another account', async () => {
    authorizeStudio(await createTestUser('staff@example.com'));
    expect((await complete(await begin(true))).status).toBe(200);
    authorizeStudio(await createTestUser('other@example.com'));
    expect((await complete(await begin(true))).status).toBe(403);
  });

  it('does not allow a password login to use the linked staff membership', async () => {
    const user = await createTestUser('staff@example.com');
    authorizeStudio(user);
    await complete(await begin(true));
    const password = await request.post(
      '/api/auth/email/login',
      {},
      {
        auth: { username: 'staff@example.com', password: 'testpassword' },
      },
    );
    request.defaults.headers.common.authorization = `Bearer ${password.data.access_token}`;
    const response = await request.get('/api/users/current/organizations');
    expect(response.data).toStrictEqual([]);
  });

  it('refreshes group removal for all sessions belonging to the same identity', async () => {
    const first = await signIn();
    unauthorize();
    const second = await signIn();
    const payload = jwt.decode(second.access_token) as jwt.JwtPayload;
    await OrganizationSsoSession.update(
      { accessTokenExpires: new Date(0) },
      { where: { id: payload.organizationSsoSessionId } },
    );
    groups = [];
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
    request.defaults.headers.common.authorization = `Bearer ${first.access_token}`;
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
  });

  it('rotates refresh tokens and revokes the session when an old token is replayed', async () => {
    const first = await signIn();
    const refreshed = await request.post('/api/auth/refresh-token', {
      refresh_token: first.refresh_token,
    });
    expect(refreshed).toMatchObject({
      status: 200,
      headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
    });
    const replay = await request.post('/api/auth/refresh-token', {
      refresh_token: first.refresh_token,
    });
    expect(replay.status).toBe(401);
    request.defaults.headers.common.authorization = `Bearer ${refreshed.data.access_token}`;
    expect((await request.get('/api/users/current')).status).toBe(401);
  });

  it('revokes credentials from a replayed session while preserving independent sessions', async () => {
    const independent = await signIn();
    unauthorize();
    const compromised = await signIn();
    const refreshed = await request.post('/api/auth/refresh-token', {
      refresh_token: compromised.refresh_token,
    });
    request.defaults.headers.common.authorization = `Bearer ${refreshed.data.access_token}`;
    const credentials = await createPersonalCredentials();
    request.defaults.headers.common.authorization = `Bearer ${credentials.accessToken}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(200);

    const replay = await request.post('/api/auth/refresh-token', {
      refresh_token: compromised.refresh_token,
    });
    expect(replay.status).toBe(401);
    expect((await request.get('/api/organizations/staff/members')).status).toBe(401);
    request.defaults.headers.common.authorization = `Bearer ${independent.access_token}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(200);
  });

  it('revokes existing access and refresh tokens when the user signs out', async () => {
    const tokens = await signIn();
    expect((await request.post('/api/auth/logout')).status).toBe(204);
    expect((await request.get('/api/users/current')).status).toBe(401);
    expect(
      (await request.post('/api/auth/refresh-token', { refresh_token: tokens.refresh_token }))
        .status,
    ).toBe(401);
  });

  it('ends the Studio session eight hours after signing in', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const tokens = await signIn();
    vi.setSystemTime(Date.now() + 8 * 60 * 60 * 1000 - 60_000);
    const renewed = await request.post('/api/auth/refresh-token', {
      refresh_token: tokens.refresh_token,
    });
    vi.setSystemTime(Date.now() + 120_000);
    const expired = await request.post('/api/auth/refresh-token', {
      refresh_token: renewed.data.refresh_token,
    });
    expect([renewed.status, expired.status]).toStrictEqual([200, 401]);
  });

  it('checks provider groups at least hourly when the provider token lasts longer', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    providerLifetime = 24 * 60 * 60;
    let tokens = await signIn();
    const refreshAnHourLater = async (): Promise<void> => {
      vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1000);
      ({ data: tokens } = await request.post('/api/auth/refresh-token', {
        refresh_token: tokens.refresh_token,
      }));
      request.defaults.headers.common.authorization = `Bearer ${tokens.access_token}`;
    };
    await refreshAnHourLater();
    groups = [];
    await refreshAnHourLater();
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
  });

  it('keeps personal credentials independent of Studio logout while checking current provider groups', async () => {
    await signIn();
    const credentials = await createPersonalCredentials();
    expect((await request.post('/api/auth/logout')).status).toBe(204);
    request.defaults.headers.common.authorization = `Bearer ${credentials.accessToken}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(200);
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    groups = [];
    expect((await request.get('/api/organizations/staff/members')).status).toBe(403);
  });

  it('rejects an already-issued CLI token after its personal credentials are deleted', async () => {
    await signIn();
    const credentials = await createPersonalCredentials();
    await request.delete(`/api/users/current/auth/oauth2/client-credentials/${credentials.id}`);
    request.defaults.headers.common.authorization = `Bearer ${credentials.accessToken}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(401);
  });

  it('rejects personal credential authentication after its source provider grant is removed', async () => {
    await signIn();
    const credentials = await createPersonalCredentials();
    await OrganizationSsoSession.destroy({ where: {} });
    request.defaults.headers.common.authorization = `Bearer ${credentials.accessToken}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(401);
    const token = await request.post(
      '/auth/oauth2/token',
      'grant_type=client_credentials&scope=organizations%3Awrite',
      {
        auth: { username: credentials.id, password: credentials.secret },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      },
    );
    expect(token.data).toStrictEqual({ error: 'invalid_grant' });
  });

  it('denies access during a provider outage and can renew the retained grant after recovery', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    providerUnavailable = true;
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
    providerUnavailable = false;
    expect((await request.get('/api/users/current/organizations')).data).toMatchObject([
      { id: 'staff' },
    ]);
  });

  it('renews access after UserInfo recovers following refresh token rotation', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    mock.onGet(`${issuer}/userinfo`).reply(503);
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
    mockProvider();
    expect((await request.get('/api/users/current/organizations')).data).toMatchObject([
      { id: 'staff' },
    ]);
  });

  it('keeps database connections available while provider renewals wait', async () => {
    const { maxSize } = (getDB().connectionManager as unknown as { pool: { maxSize: number } })
      .pool;
    const sessions: TokenResponse[] = [];
    for (let index = 0; index < maxSize; index += 1) {
      unauthorize();
      sessions.push(await signIn());
    }
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    let waiting = 0;
    let allWaiting!: () => void;
    const renewalsWaiting = new Promise<void>((resolve) => {
      allWaiting = resolve;
    });
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    beforeTokenResponse = () => {
      waiting += 1;
      if (waiting === maxSize) {
        allWaiting();
      }
      return released;
    };
    const renewals = sessions.map((session) =>
      request.get('/api/users/current/organizations', {
        headers: { authorization: `Bearer ${session.access_token}` },
      }),
    );
    await renewalsWaiting;
    expect(await User.count()).toBe(1);
    release();
    expect((await Promise.all(renewals)).map(({ data }) => data)).toStrictEqual(
      sessions.map(() => [expect.objectContaining({ id: 'staff' })]),
    );
  });

  it('keeps concurrent organization requests usable with rotating provider refresh tokens', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    beforeTokenResponse = () => setTimeout(100);
    const requests = [1, 2].map(() => request.get('/api/users/current/organizations'));
    const responses = await Promise.all(requests);
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    const nextRenewal = await request.get('/api/users/current/organizations');
    expect([...responses, nextRenewal].map(({ data }) => data)).toStrictEqual([
      [expect.objectContaining({ id: 'staff' })],
      [expect.objectContaining({ id: 'staff' })],
      [expect.objectContaining({ id: 'staff' })],
    ]);
  });

  it('retries provider discovery after an outage and reuses it during later outages', async () => {
    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
    mock.onGet(discoveryUrl).reply(503);
    expect(
      (await request.post(`${path}/login`, { link: false }, { headers: { origin } })).status,
    ).not.toBe(200);
    mockProvider();
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    mock.onGet(discoveryUrl).reply(503);
    expect((await request.get('/api/users/current/organizations')).data).toMatchObject([
      { id: 'staff' },
    ]);
  });

  it('denies renewed access when the provider omits its token expiry', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    providerLifetime = undefined;
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
  });

  it('revokes a provider grant whose renewal identifies another subject', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    claims = { sub: 'another-subject' };
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
    expect((await request.get('/api/users/current')).status).toBe(401);
  });

  it('uses fresh ID-token group claims when UserInfo does not include groups', async () => {
    userInfoClaims = { groups: undefined };
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    groups = ['/staff/translators'];
    expect((await request.get('/api/users/current/organizations')).data).toMatchObject([
      { id: 'staff', roles: [PredefinedOrganizationRole.AppTranslator] },
    ]);
  });

  it('revokes a provider grant which the identity provider rejects', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    providerGrantRevoked = true;
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
    expect((await request.get('/api/users/current')).status).toBe(401);
  });

  it('preserves an independent provider grant when another refresh token expires', async () => {
    const expired = await signIn();
    unauthorize();
    const valid = await signIn();
    const payload = jwt.decode(expired.access_token) as jwt.JwtPayload;
    const session = await OrganizationSsoSession.findByPk(payload.organizationSsoSessionId);
    mockProvider(decrypt(session!.refreshToken!, 'test-aes-secret'));
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });

    request.defaults.headers.common.authorization = `Bearer ${expired.access_token}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(403);
    request.defaults.headers.common.authorization = `Bearer ${valid.access_token}`;
    expect((await request.get('/api/organizations/staff/members')).status).toBe(200);
    request.defaults.headers.common.authorization = `Bearer ${expired.access_token}`;
    expect((await request.get('/api/users/current')).status).toBe(401);
  });

  it('rejects verifying a provider whose issuer the installation does not allow', async () => {
    await signInAsOwner();
    const response = await request.post(
      `${path}/login`,
      {
        link: true,
        configuration: { ...configuration, issuer: 'https://idp.example/realms/other' },
      },
      { headers: { origin } },
    );
    expect(response).toMatchObject({
      status: 400,
      data: { message: 'This installation does not allow single sign-on with this issuer.' },
    });
  });

  it('does not let a member without Owner permission verify a proposed provider', async () => {
    await signIn();
    const response = await request.post(
      `${path}/login`,
      { link: true, configuration: { ...configuration, name: 'Proposed provider' } },
      { headers: { origin } },
    );
    expect(response.status).toBe(403);
  });

  it('does not save a proposed provider after the verifying member loses Owner permission', async () => {
    await signInAsOwner();
    const flow = await begin(true, { ...configuration, name: 'Proposed provider' });
    await OrganizationSsoSession.update({ groups: ['/staff/translators'] }, { where: {} });
    expect((await complete(flow)).status).toBe(403);
    expect((await OrganizationSso.findByPk('staff'))!.name).toBe('Staff SSO');
  });

  it('requires signing in again before verifying a proposed provider after ten minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await signInAsOwner();
    vi.setSystemTime(Date.now() + 601_000);
    const response = await request.post(
      `${path}/login`,
      { link: true, configuration: { ...configuration, name: 'Proposed provider' } },
      { headers: { origin } },
    );
    expect(response.status).toBe(403);
  });

  it('requires signing in again after ten minutes when the provider reports a future authentication time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // eslint-disable-next-line @typescript-eslint/naming-convention
    claims = { auth_time: Math.floor(Date.now() / 1000) + 8 * 60 * 60 };
    await signInAsOwner();
    const propose = (): Promise<AxiosResponse> =>
      request.post(
        `${path}/login`,
        { link: true, configuration: { ...configuration, name: 'Proposed provider' } },
        { headers: { origin } },
      );
    expect((await propose()).status).toBe(200);
    vi.setSystemTime(Date.now() + 601_000);
    expect((await propose()).status).toBe(403);
  });

  it('does not verify a replacement for a deployment-managed provider', async () => {
    await signInAsOwner();
    await OrganizationSso.update(
      { managedBy: 'deployment' },
      { where: { OrganizationId: 'staff' } },
    );
    const response = await request.post(
      `${path}/login`,
      { link: true, configuration: { ...configuration, name: 'Proposed provider' } },
      { headers: { origin } },
    );
    expect(response.status).toBe(409);
  });

  it('preserves the active connection and Owner access when a proposed client secret is wrong', async () => {
    await signInAsOwner();
    const before = await request.get(path);
    const flow = await begin(true, { ...configuration, clientSecret: 'wrong-secret' });
    expect((await complete(flow)).status).toBe(401);
    expect((await request.get(path)).data).toStrictEqual(before.data);
    expect((await request.get('/api/organizations/staff/members')).status).toBe(200);
  });

  it('saves a proposed connection only after it authenticates the linked Owner', async () => {
    const original = await signInAsOwner();
    acceptedClientSecret = 'new-provider-secret';
    const flow = await begin(true, {
      ...configuration,
      clientSecret: acceptedClientSecret,
      name: 'Verified provider settings',
    });
    const response = await complete(flow);
    expect(response.status).toBe(200);
    request.defaults.headers.common.authorization = `Bearer ${response.data.access_token}`;
    expect((await request.get(path)).data).toMatchObject({ name: 'Verified provider settings' });
    request.defaults.headers.common.authorization = `Bearer ${original.access_token}`;
    expect((await request.get('/api/users/current')).status).toBe(401);
  });

  it('preserves Owner access when the proposed group mappings would remove it', async () => {
    await signInAsOwner();
    const flow = await begin(true, {
      ...configuration,
      roleMappings: [{ group: '/staff/owners', role: PredefinedOrganizationRole.AppTranslator }],
    });
    expect((await complete(flow)).status).toBe(403);
    expect((await request.get('/api/organizations/staff/members')).status).toBe(200);
  });

  it('does not overwrite configuration edited during provider verification', async () => {
    await signInAsOwner();
    const flow = await begin(true, { ...configuration, name: 'Pending provider settings' });
    const edit = await request.put(path, { ...configuration, name: 'Concurrent settings edit' });
    expect(edit.status).toBe(200);
    expect((await complete(flow)).status).toBe(409);
    expect((await request.get(path)).data).toMatchObject({ name: 'Concurrent settings edit' });
  });
});
