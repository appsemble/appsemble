import { type App, type AppOAuth2Secret } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../../index.js';
import pkg from '../../../package.json' with { type: 'json' };

const {
  KEYCLOAK_ADMIN_PASSWORD = 'password',
  KEYCLOAK_ADMIN_USERNAME = 'admin',
  KEYCLOAK_BASE_URL,
  KEYCLOAK_REALM = 'appsemble-e2e',
} = process.env;

const clientId = 'appsemble-oidc';
const clientSecret = 'appsemble-oidc-secret';
const userEmail = 'keycloak-user@appsemble.com';
const userPassword = 'password';

let app: App;
let organizationId: string;
let secret: AppOAuth2Secret;

async function requestKc(
  path: string,
  {
    body,
    expectedStatuses,
    method,
    token,
  }: {
    body?: string;
    expectedStatuses: number[];
    method: 'DELETE' | 'POST' | 'PUT';
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

async function getAdminToken(): Promise<string> {
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

async function createGroup(token: string, name: string, parentGroupId?: string): Promise<string> {
  const path = parentGroupId
    ? `/admin/realms/${KEYCLOAK_REALM}/groups/${parentGroupId}/children`
    : `/admin/realms/${KEYCLOAK_REALM}/groups`;
  const response = await requestKc(path, {
    body: JSON.stringify({ name }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  return response.headers.get('location')!.split('/').pop()!;
}

async function createUser(token: string): Promise<string> {
  const response = await requestKc(`/admin/realms/${KEYCLOAK_REALM}/users`, {
    body: JSON.stringify({
      credentials: [{ temporary: false, type: 'password', value: userPassword }],
      email: userEmail,
      emailVerified: true,
      enabled: true,
      firstName: 'Keycloak',
      lastName: 'User',
      username: userEmail,
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  return response.headers.get('location')!.split('/').pop()!;
}

async function joinGroup(token: string, userId: string, groupId: string): Promise<void> {
  await requestKc(`/admin/realms/${KEYCLOAK_REALM}/users/${userId}/groups/${groupId}`, {
    expectedStatuses: [204],
    method: 'PUT',
    token,
  });
}

async function configureRealm(): Promise<void> {
  const token = await getAdminToken();
  await requestKc(`/admin/realms/${KEYCLOAK_REALM}`, {
    expectedStatuses: [204, 404],
    method: 'DELETE',
    token,
  });
  await requestKc('/admin/realms', {
    body: JSON.stringify({ enabled: true, realm: KEYCLOAK_REALM }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  const parentGroupId = await createGroup(token, 'Appsemble');
  const managersGroupId = await createGroup(token, 'Managers', parentGroupId);
  const editorsGroupId = await createGroup(token, 'Editors', parentGroupId);

  await requestKc(`/admin/realms/${KEYCLOAK_REALM}/clients`, {
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
      redirectUris: ['http://appsemble:9999/callback'],
      secret: clientSecret,
      standardFlowEnabled: true,
      webOrigins: ['+'],
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  const userId = await createUser(token);
  await joinGroup(token, userId, managersGroupId);
  await joinGroup(token, userId, editorsGroupId);
}

test.describe('App Keycloak OIDC login', () => {
  test.skip(!KEYCLOAK_BASE_URL, 'Keycloak OIDC login requires KEYCLOAK_BASE_URL');

  test.beforeAll(async ({ createApp, createOrganization, randomTestId, request }) => {
    await configureRealm();

    organizationId = (await createOrganization({ id: randomTestId() })).id;
    app = await createApp(
      organizationId,
      `
        name: Keycloak Role Mapping App
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
        name: 'Keycloak OIDC',
        icon: 'key',
        authorizationUrl: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`,
        tokenUrl: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
        clientId,
        clientSecret,
        userInfoUrl: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
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

  test('should map Keycloak groups to cumulative app roles', async ({ page, visitApp }) => {
    const appUrl = await visitApp(app.id!);

    await page.goto(`${appUrl}/Login`);
    await page.getByRole('button', { name: `Login with ${secret.name}` }).click();

    await page.locator('#username').fill(userEmail);
    await page.locator('#password').fill(userPassword);
    await page.locator('#kc-login').click();

    await expect(page.getByRole('heading', { name: 'Manager content' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manager Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editor Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Auditor Page' })).toBeHidden();

    await page.getByRole('link', { name: 'Editor Page' }).click();
    await expect(page.getByRole('heading', { name: 'Editor content' })).toBeVisible();

    await page.goto(`${appUrl}/Auditor%20Page`);
    await expect(page.getByRole('heading', { name: 'Auditor content' })).toBeHidden();
  });
});
