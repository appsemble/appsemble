import { request, setTestApp } from 'axios-test-instance';

import { App, AppSamlSecret, Member, Organization } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let app: App;
let member: Member;
let organization: Organization;

beforeAll(createTestSchema('appsamlsecrets'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

afterEach(truncate);

beforeEach(async () => {
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

afterAll(closeTestSchema);

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
    expect(response).toMatchObject({
      status: 201,
      data: {
        entityId: 'https://example.com/saml/metadata.xml',
        icon: '',
        id: 1,
        idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
        name: '',
        spCertificate: expect.any(String),
        ssoUrl: 'https://example.com/saml/login',
      },
    });
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
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
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
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
  });
});

describe('getAppSamlSecrets', () => {
  it('should get SAML secrets for an app', async () => {
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
    const response = await request.get(`/api/apps/${app.id}/secrets/saml`);
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: secret.id,
          entityId: 'https://example.com/saml/metadata.xml',
          ssoUrl: 'https://example.com/saml/login',
          idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
          icon: '',
          name: '',
          spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
        },
      ],
    });
  });

  it('should only include SAML secrets for the specified app', async () => {
    authorizeStudio();
    const otherApp = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
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
    expect(response).toMatchObject({
      status: 200,
      data: [
        {
          id: secret.id,
          entityId: 'https://example.com/saml/metadata.xml',
          ssoUrl: 'https://example.com/saml/login',
          idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
          icon: '',
          name: '',
          spCertificate: '-----BEGIN CERTIFICATE-----\nSP\n-----END CERTIFICATE-----',
        },
      ],
    });
  });

  it('should not throw status 404 for unknown apps', async () => {
    authorizeStudio();
    const response = await request.get('/api/apps/53/secrets/saml');
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });

  it('should require the EditApps and EditAppSettings permissions', async () => {
    authorizeStudio();
    await member.update({ role: 'Member' });
    const response = await request.get(`/api/apps/${app.id}/secrets/saml`);
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
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
    const response = await request.put(`/api/apps/${app.id}/secrets/saml/${secret.id}`, {
      entityId: 'https://updated.example/saml/metadata.xml',
      ssoUrl: 'https://updated.example/saml/login',
      idpCertificate: '-----BEGIN CERTIFICATE-----\nUPDATED\n-----END CERTIFICATE-----',
      icon: 'updated',
      name: 'Updated',
    });
    expect(response).toMatchObject({
      status: 200,
      data: {
        entityId: 'https://updated.example/saml/metadata.xml',
        ssoUrl: 'https://updated.example/saml/login',
        idpCertificate: '-----BEGIN CERTIFICATE-----\nUPDATED\n-----END CERTIFICATE-----',
        icon: 'updated',
        name: 'Updated',
        id: 1,
        spCertificate: expect.any(String),
      },
    });
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
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'SAML secret not found', statusCode: 404 },
    });
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
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
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
    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'User does not have sufficient permissions.',
        statusCode: 403,
      },
    });
  });
});
