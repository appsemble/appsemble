import { createHash, generateKeyPairSync } from 'node:crypto';

import {
  type OrganizationSsoConfiguration,
  PredefinedOrganizationRole,
  type TokenResponse,
} from '@appsemble/types';
import axios, { type AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Organization, OrganizationSso, OrganizationSsoSession } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { encrypt } from '../../../utils/crypto.js';
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
let providerLifetime: number | undefined;
let providerUnavailable: boolean;
let providerGrantRevoked: boolean;
let acceptedClientSecret: string;
let configuration: OrganizationSsoConfiguration;
let userInfoClaims: Record<string, unknown>;
let includeIdToken: boolean;

function mockProvider(): void {
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
  mock.onPost(`${issuer}/token`).reply((config) => {
    if (providerUnavailable) {
      return [503, JSON.stringify({ error: 'temporarily_unavailable' }), headers];
    }
    if (providerGrantRevoked) {
      return [400, JSON.stringify({ error: 'invalid_grant' }), headers];
    }
    const parameters = new URLSearchParams(config.data);
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
    return [
      200,
      JSON.stringify({
        access_token: 'provider-access-token',
        refresh_token: 'provider-refresh-token',
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
  expect(response.status).toBe(200);
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
  expect(token.status).toBe(200);
  return {
    id: credentials.data.id,
    secret: credentials.data.secret,
    accessToken: token.data.access_token,
  };
}

describe('organization OIDC sign-in', () => {
  beforeEach(async () => {
    setArgv({ host: origin, secret: 'test', aesSecret: 'test-aes-secret' });
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
    providerLifetime = 300;
    providerUnavailable = false;
    providerGrantRevoked = false;
    acceptedClientSecret = 'provider-secret';
    userInfoClaims = {};
    includeIdToken = true;
    mockProvider();
  });

  afterEach(() => {
    mock.reset();
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

  it('does not grant access when no group maps to an organization role', async () => {
    groups = ['/other-organization/staff'];
    const response = await complete(await begin());
    expect(response.status).toBe(403);
  });

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
    expect(refreshed.status).toBe(200);
    const replay = await request.post('/api/auth/refresh-token', {
      refresh_token: first.refresh_token,
    });
    expect(replay.status).toBe(401);
    request.defaults.headers.common.authorization = `Bearer ${refreshed.data.access_token}`;
    expect((await request.get('/api/users/current')).status).toBe(401);
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

  it('denies renewed access when the provider omits its token expiry', async () => {
    await signIn();
    await OrganizationSsoSession.update({ accessTokenExpires: new Date(0) }, { where: {} });
    providerLifetime = undefined;
    expect((await request.get('/api/users/current/organizations')).data).toStrictEqual([]);
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
