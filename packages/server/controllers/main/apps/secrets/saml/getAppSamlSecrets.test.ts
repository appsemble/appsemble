import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let member: OrganizationMember;
let organization: Organization;

describe('getAppSamlSecrets', () => {
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

  it('should get SAML secrets for an app', async () => {
    authorizeStudio();
    const { AppSamlSecret } = await getAppDB(app.id);
    await AppSamlSecret.create({
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
      spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
      spPrivateKey: '-----BEGIN PRIVATE KEY-----\nSP\n-----END PRIVATE KEY-----',
      spPublicKey: '-----BEGIN PUBLIC KEY-----\nSP\n-----END PUBLIC KEY-----',
    });
    const response = await request.get(`/api/apps/${app.id}/secrets/saml`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "emailAttribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          "emailVerifiedAttribute": null,
          "entityId": "https://example.com/saml/metadata.xml",
          "icon": "",
          "id": 1,
          "idpCertificate": "-----BEGIN CERTIFICATE-----
      IDP
      -----END CERTIFICATE-----",
          "name": "",
          "nameAttribute": null,
          "spCertificate": "-----BEGIN CERTIFICATE-----
      SP
      -----END CERTIFICATE-----",
          "ssoUrl": "https://example.com/saml/login",
        },
      ]
    `);
  });

  it('should only include SAML secrets for the specified app', async () => {
    authorizeStudio();
    const { AppSamlSecret } = await getAppDB(app.id);
    const otherApp = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await AppSamlSecret.create({
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
      spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
      spPrivateKey: '-----BEGIN PRIVATE KEY-----\nSP\n-----END PRIVATE KEY-----',
      spPublicKey: '-----BEGIN PUBLIC KEY-----\nSP\n-----END PUBLIC KEY-----',
    });
    const { AppSamlSecret: OtherAppSamlSecret } = await getAppDB(otherApp.id);
    await OtherAppSamlSecret.create({
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nOTHER_IDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
      spCertificate: '-----BEGIN CERTIFICATE-----\nOTHER_SP\n-----END CERTIFICATE-----',
      spPrivateKey: '-----BEGIN PRIVATE KEY-----\nOTHER)SP\n-----END PRIVATE KEY-----',
      spPublicKey: '-----BEGIN PUBLIC KEY-----\nOTHER_SP\n-----END PUBLIC KEY-----',
    });
    const response = await request.get(`/api/apps/${app.id}/secrets/saml`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "emailAttribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          "emailVerifiedAttribute": null,
          "entityId": "https://example.com/saml/metadata.xml",
          "icon": "",
          "id": 1,
          "idpCertificate": "-----BEGIN CERTIFICATE-----
      IDP
      -----END CERTIFICATE-----",
          "name": "",
          "nameAttribute": null,
          "spCertificate": "-----BEGIN CERTIFICATE-----
      SP
      -----END CERTIFICATE-----",
          "ssoUrl": "https://example.com/saml/login",
        },
      ]
    `);
  });

  it('should not throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.get('/api/apps/53/secrets/saml');
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
    const response = await request.get(`/api/apps/${app.id}/secrets/saml`);
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
