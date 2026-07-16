import { promisify } from 'node:util';
import { inflateRaw } from 'node:zlib';

import { PredefinedAppRole } from '@appsemble/lang-sdk';
import { readFixture } from '@appsemble/node-utils';
import { type SAMLRedirectResponse } from '@appsemble/types';
import { DOMParser } from '@xmldom/xmldom';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  type AppSamlSecret,
  getAppDB,
  Organization,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let app: App;
let secret: AppSamlSecret;
let user: User;

const inflate = promisify(inflateRaw);
const samlAssertionNamespace = 'urn:oasis:names:tc:SAML:2.0:assertion';
const samlProtocolNamespace = 'urn:oasis:names:tc:SAML:2.0:protocol';

describe('createAuthnRequest', () => {
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
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
    });
    const { AppSamlSecret } = await getAppDB(app.id);
    secret = await AppSamlSecret.create({
      entityId: 'https://example.com/saml/metadata.xml',
      ssoUrl: 'https://example.com/saml/login',
      idpCertificate: await readFixture('saml/idp-certificate.pem', 'utf8'),
      icon: '',
      name: '',
      spCertificate: await readFixture('saml/sp-certificate.pem', 'utf8'),
      spPrivateKey: await readFixture('saml/sp-private-key.pem', 'utf8'),
      spPublicKey: await readFixture('saml/sp-public-key.pem', 'utf8'),
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should generate SAML parameters', async () => {
    const { AppMember } = await getAppDB(app.id);
    const member = await AppMember.create({
      userId: user.id,
      email: user.primaryEmail,
      role: PredefinedAppRole.Member,
    });
    authorizeStudio();
    const response = await request.post<SAMLRedirectResponse>(
      `/api/apps/${app.id}/saml/${secret.id}/authn`,
      {
        redirectUri: 'https://app.example',
        scope: 'email openid profile',
        state: 'secret state',
        timezone: 'Europe/Amsterdam',
      },
    );
    expect(response).toMatchObject({
      status: 201,
    });
    const redirect = new URL(response.data.redirect);
    expect(`${redirect.origin}${redirect.pathname}`).toBe('https://example.com/saml/login');
    const params = Object.fromEntries(redirect.searchParams.entries());
    expect(params).toStrictEqual({
      RelayState: 'http://localhost',
      SigAlg: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      SAMLRequest: expect.any(String),
      Signature: expect.any(String),
    });
    const inflated = await inflate(Buffer.from(params.SAMLRequest, 'base64'));
    const samlRequest = new DOMParser().parseFromString(
      inflated.toString('utf8'),
      'application/xml',
    ).documentElement;

    const { SamlLoginRequest } = await getAppDB(app.id);
    const loginRequest = (await SamlLoginRequest.findOne())!;
    expect(loginRequest).toMatchObject({
      id: expect.any(String),
      AppSamlSecretId: secret.id,
      AppMemberId: member.id,
      redirectUri: 'https://app.example',
      scope: 'email openid profile',
      state: 'secret state',
    });

    expect(samlRequest.namespaceURI).toBe(samlProtocolNamespace);
    expect(samlRequest.localName).toBe('AuthnRequest');
    expect(samlRequest.getAttribute('AssertionConsumerServiceURL')).toBe(
      `http://localhost/api/apps/${app.id}/saml/${secret.id}/acs`,
    );
    expect(samlRequest.getAttribute('Destination')).toBe('https://example.com/saml/login');
    expect(samlRequest.getAttribute('ID')).toBe(loginRequest.id);
    expect(samlRequest.getAttribute('IssueInstant')).toBe('1970-01-01T00:00:00.000Z');
    expect(samlRequest.getAttribute('Version')).toBe('2.0');

    const issuers = samlRequest.getElementsByTagNameNS(samlAssertionNamespace, 'Issuer');
    expect(issuers).toHaveLength(1);
    expect(issuers[0].textContent).toBe(
      `http://localhost/api/apps/${app.id}/saml/${secret.id}/metadata.xml`,
    );

    const nameIDPolicies = samlRequest.getElementsByTagNameNS(
      samlProtocolNamespace,
      'NameIDPolicy',
    );
    expect(nameIDPolicies).toHaveLength(1);
    expect(nameIDPolicies[0].getAttribute('Format')).toBe(
      'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    );
  });

  it('should generate SAML parameters for an anonymous app login', async () => {
    const response = await request.post<SAMLRedirectResponse>(
      `/api/apps/${app.id}/saml/${secret.id}/authn`,
      {
        redirectUri: 'https://app.example',
        scope: 'email openid profile',
        state: 'secret state',
        timezone: 'Europe/Amsterdam',
      },
    );
    expect(response).toMatchObject({
      status: 201,
    });

    const { SamlLoginRequest } = await getAppDB(app.id);
    const loginRequest = (await SamlLoginRequest.findOne())!;

    expect(loginRequest).toMatchObject({
      id: expect.any(String),
      AppSamlSecretId: secret.id,
      redirectUri: 'https://app.example',
      scope: 'email openid profile',
      state: 'secret state',
    });
    expect(loginRequest.AppMemberId).toBeNull();
  });

  it('should throw if the app ID is invalid', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps/64/saml/26/authn', {
      redirectUri: 'https://app.example',
      scope: 'email openid profile',
      state: 'secret state',
    });
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });

  it('should throw if the SAML secret ID is invalid', async () => {
    authorizeStudio();
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user.id,
      email: user.primaryEmail,
      role: PredefinedAppRole.Member,
    });
    const response = await request.post(`/api/apps/${app.id}/saml/26/authn`, {
      redirectUri: 'https://app.example',
      scope: 'email openid profile',
      state: 'secret state',
    });
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'SAML secret not found', statusCode: 404 },
    });
  });
});
