import { type App, type AppSamlSecret } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../../index.js';

const {
  KEYCLOAK_ADMIN_PASSWORD = 'password',
  KEYCLOAK_ADMIN_USERNAME = 'admin',
  KEYCLOAK_BASE_URL,
  KEYCLOAK_REALM = 'appsemble-e2e',
} = process.env;

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
      lastName: 'SAML User',
      username: userEmail,
    }),
    expectedStatuses: [201],
    method: 'POST',
    token,
  });

  return response.headers.get('location')!.split('/').pop()!;
}

function wrapCertificate(certificate: string): string {
  const lines = certificate.match(/.{1,64}/g);

  if (!lines) {
    throw new Error('Could not wrap Keycloak signing certificate');
  }

  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

async function getSigningCertificate(token: string): Promise<string> {
  const response = await requestKc(`/admin/realms/${KEYCLOAK_REALM}/keys`, {
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

  idpCertificate = await getSigningCertificate(token);

  const parentGroupId = await createGroup(token, 'Appsemble');
  const managersGroupId = await createGroup(token, 'Managers', parentGroupId);
  const editorsGroupId = await createGroup(token, 'Editors', parentGroupId);
  const userId = await createUser(token);

  await joinGroup(token, userId, managersGroupId);
  await joinGroup(token, userId, editorsGroupId);
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
                version: 0.36.7
                parameters:
                  content: <h1>Manager content</h1>
          - name: Editor Page
            roles:
              - Editor
            blocks:
              - type: html
                version: 0.36.7
                parameters:
                  content: <h1>Editor content</h1>
          - name: Auditor Page
            roles:
              - Auditor
            blocks:
              - type: html
                version: 0.36.7
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

    await page.locator('#username').fill(userEmail);
    await page.locator('#password').fill(userPassword);
    await page.locator('#kc-login').click();

    await expect(page.getByRole('heading', { name: 'Manager content' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manager Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editor Page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Auditor Page' })).toBeHidden();

    await page.getByRole('link', { name: 'Editor Page' }).click();
    await expect(page.getByRole('heading', { name: 'Editor content' })).toBeVisible();
  });
});
