import { type App, type AppSamlSecret } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../../index.js';
import pkg from '../../../package.json' with { type: 'json' };
import {
  createGroup,
  createRealm,
  createUser,
  getAdminToken,
  getSigningCertificate,
  joinGroup,
  requestKc,
} from './utils/keycloak-admin.js';

const { KEYCLOAK_BASE_URL, KEYCLOAK_REALM = 'appsemble-e2e' } = process.env;

const appsembleBaseUrl = 'http://appsemble:9999';
const samlAttributeNameFormat = 'attribute.nameformat';
const samlAssertionConsumerUrlPostAttribute = 'saml_assertion_consumer_url_post';
const samlAuthnStatementAttribute = 'saml.authnstatement';
const samlNameIdFormatAttribute = 'saml_name_id_format';
const userEmail = 'keycloak-saml-user@appsemble.com';
const userPassword = 'password';

let app: App;
let idpCertificate: string;
let organizationId: string;
let secret: AppSamlSecret;

test.use({ timezoneId: 'Europe/Amsterdam' });

async function configureRealm(): Promise<void> {
  const token = await getAdminToken();
  await createRealm(token, KEYCLOAK_REALM);

  idpCertificate = await getSigningCertificate(token, KEYCLOAK_REALM);

  const parentGroupId = await createGroup(token, KEYCLOAK_REALM, 'Appsemble');
  const managersGroupId = await createGroup(token, KEYCLOAK_REALM, 'Managers', parentGroupId);
  const editorsGroupId = await createGroup(token, KEYCLOAK_REALM, 'Editors', parentGroupId);
  const userId = await createUser(token, KEYCLOAK_REALM, {
    email: userEmail,
    firstName: 'Keycloak',
    lastName: 'SAML User',
    password: userPassword,
  });

  await joinGroup(token, KEYCLOAK_REALM, userId, managersGroupId);
  await joinGroup(token, KEYCLOAK_REALM, userId, editorsGroupId);
}

async function createSamlClient(token: string, appId: number, secretId: number): Promise<void> {
  const samlBaseUrl = `${appsembleBaseUrl}/api/apps/${appId}/saml/${secretId}`;
  const acsUrl = `${samlBaseUrl}/acs`;
  const metadataUrl = `${samlBaseUrl}/metadata.xml`;

  await requestKc(`/admin/realms/${KEYCLOAK_REALM}/clients`, {
    body: JSON.stringify({
      attributes: {
        'saml.assertion.signature': 'true',
        [samlAuthnStatementAttribute]: 'true',
        'saml.client.signature': 'false',
        'saml.encrypt': 'false',
        'saml.force.post.binding': 'true',
        'saml.server.signature': 'true',
        'saml.signature.algorithm': 'RSA_SHA256',
        [samlAssertionConsumerUrlPostAttribute]: acsUrl,
        [samlNameIdFormatAttribute]: 'email',
      },
      clientId: metadataUrl,
      enabled: true,
      name: 'Appsemble SAML',
      protocol: 'saml',
      protocolMappers: [
        {
          config: {
            'attribute.name': 'email',
            [samlAttributeNameFormat]: 'Basic',
            'user.attribute': 'email',
          },
          name: 'email',
          protocol: 'saml',
          protocolMapper: 'saml-user-property-mapper',
        },
        {
          config: {
            'attribute.name': 'emailVerified',
            [samlAttributeNameFormat]: 'Basic',
            'attribute.value': 'true',
          },
          name: 'email verified',
          protocol: 'saml',
          protocolMapper: 'saml-hardcode-attribute-mapper',
        },
        {
          config: {
            'attribute.name': 'name',
            [samlAttributeNameFormat]: 'Basic',
            'user.attribute': 'firstName',
          },
          name: 'name',
          protocol: 'saml',
          protocolMapper: 'saml-user-property-mapper',
        },
        {
          config: {
            'attribute.name': 'memberOf',
            [samlAttributeNameFormat]: 'Basic',
            'full.path': 'true',
            single: 'true',
          },
          name: 'groups',
          protocol: 'saml',
          protocolMapper: 'saml-group-membership-mapper',
        },
      ],
      redirectUris: [acsUrl],
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });
}

test.describe('App Keycloak SAML login', () => {
  test.skip(!KEYCLOAK_BASE_URL, 'Keycloak SAML login requires KEYCLOAK_BASE_URL');

  test.beforeAll(async ({ createApp, createOrganization, randomTestId, request }) => {
    await configureRealm();

    organizationId = (await createOrganization({ id: randomTestId() })).id;
    app = await createApp(
      organizationId,
      `
        name: Keycloak SAML Roles App
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

    const response = await request.post(`/api/apps/${app.id}/secrets/saml`, {
      data: {
        name: 'Keycloak SAML',
        icon: 'key',
        entityId: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/saml/descriptor`,
        ssoUrl: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/saml`,
        idpCertificate,
        emailAttribute: 'email',
        emailVerifiedAttribute: 'emailVerified',
        nameAttribute: 'name',
        groupAttribute: 'memberOf',
        roleMappings: [
          { group: '/Appsemble/Managers', role: 'Manager' },
          { group: '/Appsemble/Editors', role: 'Editor' },
        ],
      },
    });

    expect(response.status()).toBe(201);
    secret = (await response.json()) as AppSamlSecret;

    await createSamlClient(await getAdminToken(), app.id!, secret.id!);
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
    await page.getByLabel('Password').fill(userPassword);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('heading', { name: 'Manager content' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manager Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editor Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Auditor Page' })).toBeHidden();

    await page.getByRole('link', { name: 'Editor Page' }).click();
    await expect(page.getByRole('heading', { name: 'Editor content' })).toBeVisible();
  });
});
