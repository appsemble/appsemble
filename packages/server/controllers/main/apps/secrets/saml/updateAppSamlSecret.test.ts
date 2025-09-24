import {
  type AppSamlSecret as AppSamlSecretType,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let member: OrganizationMember;
let organization: Organization;

describe('updateAppSamlSecret', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should generate SAML parameters', async () => {
    authorizeStudio();
    const { AppSamlSecret } = await getAppDB(app.id);
    const secret = await AppSamlSecret.create({
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
      spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
      spPrivateKey: '-----BEGIN PRIVATE KEY-----\nSP\n-----END PRIVATE KEY-----',
      spPublicKey: '-----BEGIN PUBLIC KEY-----\nSP\n-----END PUBLIC KEY-----',
    });
    const response = await request.put<AppSamlSecretType>(
      `/api/apps/${app.id}/secrets/saml/${secret.id}`,
      {
        entityId: 'https://updated.example/saml/metadata.xml',
        ssoUrl: 'https://updated.example/saml/login',
        idpCertificate: '-----BEGIN CERTIFICATE-----\nUPDATED\n-----END CERTIFICATE-----',
        icon: 'updated',
        name: 'Updated',
      },
    );
    expect(response).toMatchInlineSnapshot(
      { data: { spCertificate: expect.any(String) } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "emailAttribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        "emailVerifiedAttribute": null,
        "entityId": "https://updated.example/saml/metadata.xml",
        "icon": "updated",
        "id": 1,
        "idpCertificate": "-----BEGIN CERTIFICATE-----
      UPDATED
      -----END CERTIFICATE-----",
        "name": "Updated",
        "nameAttribute": null,
        "spCertificate": Any<String>,
        "ssoUrl": "https://updated.example/saml/login",
        "updated": "1970-01-01T00:00:00.000Z",
      }
    `,
    );
    await secret.reload();
    const { updated, ...data } = response.data;
    expect(secret).toMatchObject(data);
  });

  it('should not throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.put(`/api/apps/${app.id}/secrets/saml/1`, {
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "SAML secret not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not throw status 404 for unknown secrets', async () => {
    authorizeStudio();
    const response = await request.put('/api/apps/13/secrets/saml/1', {
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should require the EditApps and EditAppSettings permissions', async () => {
    authorizeStudio();
    await member.update({ role: 'Member' });
    const response = await request.put(`/api/apps/${app.id}/secrets/saml/34`, {
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
    });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });
});
