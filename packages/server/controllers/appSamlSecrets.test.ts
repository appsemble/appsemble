import { AppSamlSecret as AppSamlSecretType } from '@appsemble/types';
import { install, InstalledClock } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppSamlSecret, Member, Organization } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

let app: App;
let clock: InstalledClock;
let member: Member;
let organization: Organization;

useTestDatabase('appsamlsecrets');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  clock = install();
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
  member = await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

afterEach(() => {
  clock.uninstall();
});

describe('createSamlSecret', () => {
  it('should generate SAML parameters', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/secrets/saml`, {
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
    });
    expect(response).toMatchInlineSnapshot(
      { data: { spCertificate: expect.any(String) } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "entityId": "https://example.com/saml/metadata.xml",
        "icon": "",
        "id": 1,
        "idpCertificate": "-----BEGIN CERTIFICATE-----
      IDP
      -----END CERTIFICATE-----",
        "name": "",
        "spCertificate": Any<String>,
        "ssoUrl": "https://example.com/saml/login",
      }
    `,
    );
  });

  it('should not throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/13/secrets/saml', {
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
    const response = await request.post(`/api/apps/${app.id}/secrets/saml`, {
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
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('getAppSamlSecrets', () => {
  it('should get SAML secrets for an app', async () => {
    authorizeStudio();
    await AppSamlSecret.create({
      AppId: app.id,
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
          "emailAttribute": null,
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
    const otherApp = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    await AppSamlSecret.create({
      AppId: app.id,
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
      spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
      spPrivateKey: '-----BEGIN PRIVATE KEY-----\nSP\n-----END PRIVATE KEY-----',
      spPublicKey: '-----BEGIN PUBLIC KEY-----\nSP\n-----END PUBLIC KEY-----',
    });
    await AppSamlSecret.create({
      AppId: otherApp.id,
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
          "emailAttribute": null,
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
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('updateAppSamlSecret', () => {
  it('should generate SAML parameters', async () => {
    authorizeStudio();
    const secret = await AppSamlSecret.create({
      AppId: app.id,
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
        "emailAttribute": null,
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
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});

describe('deleteAppSamlSecret', () => {
  it('should generate SAML parameters', async () => {
    authorizeStudio();
    const secret = await AppSamlSecret.create({
      AppId: app.id,
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
      icon: '',
      name: '',
      spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
      spPrivateKey: '-----BEGIN PRIVATE KEY-----\nSP\n-----END PRIVATE KEY-----',
      spPublicKey: '-----BEGIN PUBLIC KEY-----\nSP\n-----END PUBLIC KEY-----',
    });
    const response = await request.delete<AppSamlSecretType>(
      `/api/apps/${app.id}/secrets/saml/${secret.id}`,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('should not throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/secrets/saml/1`);
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
    const response = await request.delete('/api/apps/13/secrets/saml/1');
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
    const response = await request.delete(`/api/apps/${app.id}/secrets/saml/34`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient permissions.",
        "statusCode": 403,
      }
    `);
  });
});
