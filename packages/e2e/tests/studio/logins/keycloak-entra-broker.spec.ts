import { type App, type AppOAuth2Secret } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../../index.js';
import pkg from '../../../package.json' with { type: 'json' };
import {
  createGroup,
  createIdpGroupMapper,
  createOidcIdentityProvider,
  createRealm,
  createUpstreamOidcClient,
  createUser,
  getAdminToken,
  joinGroup,
  requestKc,
} from './utils/keycloak-admin.js';

const { KEYCLOAK_BASE_URL } = process.env;

// Realm that plays the role of Microsoft Entra ID (the upstream identity provider).
const upstreamRealm = 'entra-upstream';
// Realm Appsemble points at; it federates to the upstream realm through Keycloak brokering.
const brokerRealm = 'appsemble-broker';

const idpAlias = 'entra-upstream';
const idpDisplayName = 'Entra';
const upstreamClientId = 'appsemble-upstream';
const upstreamClientSecret = 'appsemble-upstream-secret';
const brokerClientId = 'appsemble-oidc';
const brokerClientSecret = 'appsemble-oidc-secret';

const memberEmail = 'entra-member@appsemble.com';
const outsiderEmail = 'entra-outsider@appsemble.com';
const userPassword = 'password';

const upstreamOidcUrl = `${KEYCLOAK_BASE_URL}/realms/${upstreamRealm}/protocol/openid-connect`;
const brokerOidcUrl = `${KEYCLOAK_BASE_URL}/realms/${brokerRealm}/protocol/openid-connect`;
// The upstream client redirects the broker hop back to this Keycloak identity broker endpoint.
const brokerEndpoint = `${KEYCLOAK_BASE_URL}/realms/${brokerRealm}/broker/${idpAlias}/endpoint`;

let app: App;
let organizationId: string;
let secret: AppOAuth2Secret;

/**
 * Create the Appsemble OIDC client in the broker realm.
 *
 * The brokered user is not a member of any Keycloak group in the broker realm, so this client
 * re-emits the `groups` user attribute imported by the identity provider mapper as a `groups`
 * claim, keeping the upstream group paths intact for Appsemble's role mappings.
 *
 * @param token A Keycloak admin bearer token.
 */
async function createBrokerClient(token: string): Promise<void> {
  await requestKc(`/admin/realms/${brokerRealm}/clients`, {
    body: JSON.stringify({
      clientAuthenticatorType: 'client-secret',
      clientId: brokerClientId,
      directAccessGrantsEnabled: true,
      enabled: true,
      protocol: 'openid-connect',
      protocolMappers: [
        {
          config: {
            'access.token.claim': 'true',
            'claim.name': 'groups',
            'id.token.claim': 'true',
            'jsonType.label': 'String',
            multivalued: 'true',
            'user.attribute': 'groups',
            'userinfo.token.claim': 'true',
          },
          name: 'groups',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
        },
      ],
      publicClient: false,
      redirectUris: ['http://appsemble:9999/callback'],
      secret: brokerClientSecret,
      standardFlowEnabled: true,
      webOrigins: ['+'],
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });
}

async function configureRealms(): Promise<void> {
  const token = await getAdminToken();

  // Upstream realm: groups, an OIDC client emitting full group paths, and two users.
  await createRealm(token, upstreamRealm);
  const parentGroupId = await createGroup(token, upstreamRealm, 'Appsemble');
  const managersGroupId = await createGroup(token, upstreamRealm, 'Managers', parentGroupId);
  const editorsGroupId = await createGroup(token, upstreamRealm, 'Editors', parentGroupId);

  await createUpstreamOidcClient(token, upstreamRealm, {
    clientId: upstreamClientId,
    clientSecret: upstreamClientSecret,
    redirectUris: [brokerEndpoint],
  });

  const memberId = await createUser(token, upstreamRealm, {
    email: memberEmail,
    firstName: 'Entra',
    lastName: 'Member',
    password: userPassword,
  });
  await joinGroup(token, upstreamRealm, memberId, managersGroupId);
  await joinGroup(token, upstreamRealm, memberId, editorsGroupId);

  // Outsider authenticates against the upstream realm but belongs to no mapped group.
  await createUser(token, upstreamRealm, {
    email: outsiderEmail,
    firstName: 'Entra',
    lastName: 'Outsider',
    password: userPassword,
  });

  // Broker realm: the OIDC identity provider federating to the upstream realm, the group mapper
  // importing the upstream `groups` claim, and the Appsemble client.
  await createRealm(token, brokerRealm);
  await createOidcIdentityProvider(token, brokerRealm, {
    alias: idpAlias,
    authorizationUrl: `${upstreamOidcUrl}/auth`,
    clientId: upstreamClientId,
    clientSecret: upstreamClientSecret,
    displayName: idpDisplayName,
    jwksUrl: `${upstreamOidcUrl}/certs`,
    tokenUrl: `${upstreamOidcUrl}/token`,
    userInfoUrl: `${upstreamOidcUrl}/userinfo`,
  });
  await createIdpGroupMapper(token, brokerRealm, idpAlias);
  await createBrokerClient(token);
}

test.describe('App Keycloak brokered Entra OIDC login', () => {
  test.skip(!KEYCLOAK_BASE_URL, 'Keycloak brokered login requires KEYCLOAK_BASE_URL');

  // The scenarios share two fixed Keycloak realms, so their setup and login flows must not race.
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ createApp, createOrganization, randomTestId, request }) => {
    await configureRealms();

    organizationId = (await createOrganization({ id: randomTestId() })).id;
    app = await createApp(
      organizationId,
      `
        name: Keycloak Entra Broker App
        defaultPage: Manager Page
        security:
          default:
            role: Viewer
            policy: everyone
          roles:
            Viewer: {}
            Manager: {}
            Editor: {}
            Auditor: {}
        pages:
          - name: Manager Page
            roles:
              - Manager
            blocks:
              - type: html
                version: ${pkg.version}
                parameters:
                  content: <h1>Manager content</h1>
          - name: Editor Page
            roles:
              - Editor
            blocks:
              - type: html
                version: ${pkg.version}
                parameters:
                  content: <h1>Editor content</h1>
          - name: Auditor Page
            roles:
              - Auditor
            blocks:
              - type: html
                version: ${pkg.version}
                parameters:
                  content: <h1>Auditor content</h1>
      `,
    );

    const response = await request.post(`/api/apps/${app.id}/secrets/oauth2`, {
      data: {
        name: 'Keycloak Entra Broker',
        icon: 'key',
        authorizationUrl: `${brokerOidcUrl}/auth`,
        tokenUrl: `${brokerOidcUrl}/token`,
        clientId: brokerClientId,
        clientSecret: brokerClientSecret,
        userInfoUrl: `${brokerOidcUrl}/userinfo`,
        scope: 'email openid profile',
        roleMappings: [
          { group: '/Appsemble/Managers', role: 'Manager' },
          { group: '/Appsemble/Editors', role: 'Editor' },
        ],
      },
    });

    expect(response.status()).toBe(201);
    secret = (await response.json()) as AppOAuth2Secret;
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    if (app?.id != null) {
      await deleteApp(app.id);
    }

    if (organizationId) {
      await deleteOrganization(organizationId);
    }
  });

  test('should map brokered Entra groups to cumulative app roles', async ({ page, visitApp }) => {
    const appUrl = await visitApp(app.id!);

    await page.goto(`${appUrl}/Login`);
    await page.getByRole('button', { name: `Login with ${secret.name}` }).click();

    // Broker realm login page: follow the upstream identity provider.
    await page.getByRole('link', { name: idpDisplayName }).click();

    // Upstream realm login form.
    await page.getByRole('textbox', { name: /username or email/i }).fill(memberEmail);
    await page.getByRole('textbox', { exact: true, name: 'Password' }).fill(userPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'Manager content' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manager Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editor Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Auditor Page' })).toBeHidden();

    await page.getByRole('link', { name: 'Editor Page' }).click();
    await expect(page.getByRole('heading', { name: 'Editor content' })).toBeVisible();

    await page.goto(`${appUrl}/Auditor%20Page`);
    await expect(page.getByRole('heading', { name: 'Auditor content' })).toBeHidden();
  });

  test('should deny login when no brokered group maps to an app role', async ({
    page,
    visitApp,
  }) => {
    const appUrl = await visitApp(app.id!);
    const verifyResult = page
      .waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname ===
            `/api/apps/${app.id}/secrets/oauth2/${secret.id}/verify`,
      )
      .then(async (response) => ({
        body: (await response.json()) as { message?: string },
        status: response.status(),
      }));

    await page.goto(`${appUrl}/Login`);
    await page.getByRole('button', { name: `Login with ${secret.name}` }).click();

    await page.getByRole('link', { name: idpDisplayName }).click();

    await page.getByRole('textbox', { name: /username or email/i }).fill(outsiderEmail);
    await page.getByRole('textbox', { exact: true, name: 'Password' }).fill(userPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    const { body, status } = await verifyResult;
    expect(status).toBe(403);
    expect(body).toMatchObject({
      message: 'User is not allowed to login because no external group matched an app role.',
    });

    await expect(page.getByText('An unexpected error occurred while logging in')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Manager content' })).toBeHidden();
  });
});
