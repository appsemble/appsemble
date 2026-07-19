import { type App, type AppOAuth2Secret } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../../index.js';
import pkg from '../../../package.json' with { type: 'json' };
import {
  createGroup,
  createRealm,
  createUser,
  getAdminToken,
  joinGroup,
  requestKc,
} from './utils/keycloak-admin.js';

const { KEYCLOAK_BASE_URL, KEYCLOAK_REALM = 'appsemble-e2e' } = process.env;

const clientId = 'appsemble-oidc';
const clientSecret = 'appsemble-oidc-secret';
const userEmail = 'keycloak-user@appsemble.com';
const userPassword = 'password';

let app: App;
let organizationId: string;
let secret: AppOAuth2Secret;

async function configureRealm(): Promise<void> {
  const token = await getAdminToken();
  await createRealm(token, KEYCLOAK_REALM);

  const parentGroupId = await createGroup(token, KEYCLOAK_REALM, 'Appsemble');
  const managersGroupId = await createGroup(token, KEYCLOAK_REALM, 'Managers', parentGroupId);
  const editorsGroupId = await createGroup(token, KEYCLOAK_REALM, 'Editors', parentGroupId);

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

  const userId = await createUser(token, KEYCLOAK_REALM, {
    email: userEmail,
    firstName: 'Keycloak',
    lastName: 'User',
    password: userPassword,
  });
  await joinGroup(token, KEYCLOAK_REALM, userId, managersGroupId);
  await joinGroup(token, KEYCLOAK_REALM, userId, editorsGroupId);
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

    await page.getByRole('textbox', { name: /username or email/i }).fill(userEmail);
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
});
