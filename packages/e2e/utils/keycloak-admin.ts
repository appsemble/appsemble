const {
  KEYCLOAK_ADMIN_PASSWORD = 'password',
  KEYCLOAK_ADMIN_USERNAME = 'admin',
  KEYCLOAK_BASE_URL,
} = process.env;

/**
 * Perform an authenticated request against the Keycloak admin REST API.
 *
 * @param path The path relative to `KEYCLOAK_BASE_URL`.
 * @param options The request options: a serialized `body`, the `expectedStatuses` treated as
 *   successful, the HTTP `method`, and a Keycloak admin bearer `token`.
 * @returns The raw fetch response.
 */
export async function requestKc(
  path: string,
  {
    body,
    expectedStatuses,
    method,
    token,
  }: {
    body?: string;
    expectedStatuses: number[];
    method: 'DELETE' | 'GET' | 'POST' | 'PUT';
    token: string;
  },
): Promise<Response> {
  const response = await fetch(`${KEYCLOAK_BASE_URL}${path}`, {
    body,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    method,
  });

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${method} ${path} returned ${response.status}: ${await response.text()}`);
  }

  return response;
}

/**
 * Obtain a Keycloak admin token from the `master` realm.
 *
 * The Keycloak service may still be starting when the tests begin, so this retries for a while.
 *
 * @returns The `admin-cli` access token.
 */
export async function getAdminToken(): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(
        `${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`,
        {
          body: new URLSearchParams({
            client_id: 'admin-cli',
            grant_type: 'password',
            password: KEYCLOAK_ADMIN_PASSWORD,
            username: KEYCLOAK_ADMIN_USERNAME,
          }),
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          method: 'POST',
        },
      );

      if (response.ok) {
        const { access_token: token } = (await response.json()) as { access_token: string };
        return token;
      }
    } catch {
      // The service may still be starting.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  throw new Error('Could not obtain Keycloak admin token');
}

/**
 * Recreate a realm from scratch by deleting any existing realm and creating an empty one.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The realm name.
 */
export async function createRealm(token: string, realm: string): Promise<void> {
  await requestKc(`/admin/realms/${realm}`, {
    expectedStatuses: [204, 404],
    method: 'DELETE',
    token,
  });
  await requestKc('/admin/realms', {
    body: JSON.stringify({ enabled: true, realm }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });
}

/**
 * Create a group, optionally nested under a parent group.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The realm name.
 * @param name The group name.
 * @param parentGroupId The id of the parent group, when creating a nested group.
 * @returns The id of the created group.
 */
export async function createGroup(
  token: string,
  realm: string,
  name: string,
  parentGroupId?: string,
): Promise<string> {
  const path = parentGroupId
    ? `/admin/realms/${realm}/groups/${parentGroupId}/children`
    : `/admin/realms/${realm}/groups`;
  const response = await requestKc(path, {
    body: JSON.stringify({ name }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  return response.headers.get('location')!.split('/').pop()!;
}

/**
 * Create an enabled user with a permanent password.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The realm name.
 * @param user The user to create: `email` (also used as the username), `firstName`, `lastName`,
 *   and `password`.
 * @returns The id of the created user.
 */
export async function createUser(
  token: string,
  realm: string,
  {
    email,
    firstName,
    lastName,
    password,
  }: { email: string; firstName: string; lastName: string; password: string },
): Promise<string> {
  const response = await requestKc(`/admin/realms/${realm}/users`, {
    body: JSON.stringify({
      credentials: [{ temporary: false, type: 'password', value: password }],
      email,
      emailVerified: true,
      enabled: true,
      firstName,
      lastName,
      username: email,
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  return response.headers.get('location')!.split('/').pop()!;
}

/**
 * Add a user to a group.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The realm name.
 * @param userId The user id.
 * @param groupId The group id.
 */
export async function joinGroup(
  token: string,
  realm: string,
  userId: string,
  groupId: string,
): Promise<void> {
  await requestKc(`/admin/realms/${realm}/users/${userId}/groups/${groupId}`, {
    expectedStatuses: [204],
    method: 'PUT',
    token,
  });
}

function wrapCertificate(certificate: string): string {
  const lines = certificate.match(/.{1,64}/g);

  if (!lines) {
    throw new Error('Could not wrap Keycloak signing certificate');
  }

  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

/**
 * Fetch the active PEM-wrapped signing certificate of a realm.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The realm name.
 * @returns The PEM-wrapped signing certificate.
 */
export async function getSigningCertificate(token: string, realm: string): Promise<string> {
  const response = await requestKc(`/admin/realms/${realm}/keys`, {
    expectedStatuses: [200],
    method: 'GET',
    token,
  });
  const { keys } = (await response.json()) as {
    keys: { certificate?: string; status?: string; use?: string }[];
  };
  const certificate = keys.find(
    (key) => key.use === 'SIG' && key.status === 'ACTIVE' && key.certificate,
  )?.certificate;

  if (!certificate) {
    throw new Error('Could not find Keycloak signing certificate');
  }

  return wrapCertificate(certificate);
}

/**
 * Create a confidential OIDC client whose tokens carry group memberships as a `groups` claim.
 *
 * This mirrors the client the plain OIDC login test uses, but points its redirect URI at a
 * Keycloak identity broker endpoint so a broker realm can federate to this realm.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The upstream realm name.
 * @param client The client to create: `clientId`, `clientSecret`, and the allowed `redirectUris`
 *   (typically the broker endpoint).
 */
export async function createUpstreamOidcClient(
  token: string,
  realm: string,
  {
    clientId,
    clientSecret,
    redirectUris,
  }: { clientId: string; clientSecret: string; redirectUris: string[] },
): Promise<void> {
  await requestKc(`/admin/realms/${realm}/clients`, {
    body: JSON.stringify({
      clientAuthenticatorType: 'client-secret',
      clientId,
      directAccessGrantsEnabled: true,
      enabled: true,
      protocol: 'openid-connect',
      protocolMappers: [
        {
          config: {
            'access.token.claim': 'true',
            'claim.name': 'groups',
            'full.path': 'true',
            'id.token.claim': 'true',
            'userinfo.token.claim': 'true',
          },
          name: 'groups',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-group-membership-mapper',
        },
      ],
      publicClient: false,
      redirectUris,
      secret: clientSecret,
      standardFlowEnabled: true,
      webOrigins: ['+'],
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });
}

/**
 * Create an OIDC identity provider that federates a broker realm to an upstream realm.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The broker realm name.
 * @param config The identity provider configuration: the `alias`, the `displayName` shown on the
 *   broker login page, the upstream `authorizationUrl`, `tokenUrl`, `userInfoUrl`, and `jwksUrl`
 *   endpoints, and the `clientId` and `clientSecret` registered in the upstream realm.
 */
export async function createOidcIdentityProvider(
  token: string,
  realm: string,
  {
    alias,
    authorizationUrl,
    clientId,
    clientSecret,
    displayName,
    jwksUrl,
    tokenUrl,
    userInfoUrl,
  }: {
    alias: string;
    authorizationUrl: string;
    clientId: string;
    clientSecret: string;
    displayName: string;
    jwksUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
  },
): Promise<void> {
  await requestKc(`/admin/realms/${realm}/identity-provider/instances`, {
    body: JSON.stringify({
      alias,
      displayName,
      enabled: true,
      providerId: 'oidc',
      storeToken: false,
      trustEmail: true,
      config: {
        authorizationUrl,
        clientAuthMethod: 'client_secret_post',
        clientId,
        clientSecret,
        defaultScope: 'openid email profile',
        jwksUrl,
        syncMode: 'FORCE',
        tokenUrl,
        useJwksUrl: 'true',
        userInfoUrl,
        validateSignature: 'true',
      },
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });
}

/**
 * Add a mapper that imports the upstream `groups` claim into a `groups` attribute on brokered
 * users, so a downstream client in the broker realm can re-emit it as a `groups` claim.
 *
 * @param token A Keycloak admin bearer token.
 * @param realm The broker realm name.
 * @param alias The identity provider alias.
 */
export async function createIdpGroupMapper(
  token: string,
  realm: string,
  alias: string,
): Promise<void> {
  await requestKc(`/admin/realms/${realm}/identity-provider/instances/${alias}/mappers`, {
    body: JSON.stringify({
      config: {
        claim: 'groups',
        syncMode: 'FORCE',
        'user.attribute': 'groups',
      },
      identityProviderAlias: alias,
      identityProviderMapper: 'oidc-user-attribute-idp-mapper',
      name: 'groups',
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });
}
