import { promisify } from 'node:util';
import { inflateRaw } from 'node:zlib';

import { readFixture } from '@appsemble/node-utils';
import { type SAMLRedirectResponse } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { toXml } from 'xast-util-to-xml';
import { x as h } from 'xastscript';

import { App, AppSamlSecret, Organization, SamlLoginRequest, type User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;
let secret: AppSamlSecret;
let user: User;

const inflate = promisify(inflateRaw);

interface CreateSamlResponseOptions {
  statusCode?: string;
  subject?: { nameId?: string; loginId?: string };
  digest?: string;
}

/**
 * Create SAML response object for testing.
 *
 * The response was generated using `flask-saml2`.
 *
 * @param options Options for the SAML response
 * @returns the base64 encoded SAML response object.
 */
function createSamlResponse({
  digest = 'QZii75yFqDTK8/RwecJX1RFca8o=',
  statusCode = 'urn:oasis:names:tc:SAML:2.0:status:Success',
  subject = { nameId: 'user@idp.example', loginId: 'id00000000-0000-0000-0000-000000000000' },
}: CreateSamlResponseOptions = {}): string {
  const tree = (
    <samlp:Response
      Destination="http://localhost:9999/api/apps/7/saml/1/acs"
      ID="_5190f0683c9e4b77a4e0a8ffd4d4a4dd"
      InResponseTo="id27748888-5253-48bf-8cf5-b65f793b7643"
      IssueInstant="2020-11-20T10:26:11.008603+00:00"
      Version="2.0"
      xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    >
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
        http://localhost:8000/saml/metadata.xml
      </saml:Issuer>
      <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
          <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
          <ds:Reference URI="#_5190f0683c9e4b77a4e0a8ffd4d4a4dd">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
              <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
            <ds:DigestValue>{digest}</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>
          GKQRfvJ0BR1geBqUttE6eXZCj9Ac+n1KPrN7R9odfrL8mXaU71aqW+rkNRCRV8NrY019bHDNDlWBpYDMLwsqcA==
        </ds:SignatureValue>
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>
              MIICKzCCAdWgAwIBAgIJAM8DxRNtPj90MA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIEw
              pTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTEwODEyMjA1MTIzWhcN
              MTIwODExMjA1MTIzWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMYSW50ZX
              JuZXQgV2lkZ2l0cyBQdHkgTHRkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANcNmgm4YlSUAr2xdWei5aRU/DbW
              tsQ47gjkv28Ekje3ob+6q0M+D5phwYDcv9ygYmuJ5wOi1cPprsWdFWmvSusCAwEAAaOBpzCBpDAdBgNVHQ4EFg
              QUzyBR9+vE8bygqvD6CZ/w6aQPikMwdQYDVR0jBG4wbIAUzyBR9+vE8bygqvD6CZ/w6aQPikOhSaRHMEUxCzAJ
              BgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdG
              SCCQDPA8UTbT4/dDAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUAA0EAIQuPLA/mlMJAMF680kL7reX5WgyR
              wAtRzJK6FgNjE7kRaLZQ79UKYVYa0VAyrRdoNEyVhG4tJFEiQJzaLWsl/A==
            </ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </ds:Signature>
      <samlp:Status>
        <samlp:StatusCode Value={statusCode} />
      </samlp:Status>
      <saml:Assertion
        ID="_2d1e69f46b0b4e569928a2a0861ff2a4"
        IssueInstant="2020-11-20T10:26:11.008603+00:00"
        Version="2.0"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
      >
        <saml:Issuer>http://localhost:8000/saml/metadata.xml</saml:Issuer>
        <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
          <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
            <ds:Reference URI="#_2d1e69f46b0b4e569928a2a0861ff2a4">
              <ds:Transforms>
                <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature/" />
                <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
              </ds:Transforms>
              <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
              <ds:DigestValue>aeMoD3gP962UNfpc8Qxd0aAELMo=</ds:DigestValue>
            </ds:Reference>
          </ds:SignedInfo>
          <ds:SignatureValue>
            Y+4rrPo0doC1Tos1zsGZJr7IgNtkbf4kVKE/Au/+RNCSSLrDSOur5D5Ic5cYMhRRzidZh1xqcxaliRjgXZK4Lg==
          </ds:SignatureValue>
          <ds:KeyInfo>
            <ds:X509Data>
              <ds:X509Certificate>
                MIICKzCCAdWgAwIBAgIJAM8DxRNtPj90MA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQI
                EwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTEwODEyMjA1MTIz
                WhcNMTIwODExMjA1MTIzWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMY
                SW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANcNmgm4YlSUAr2xdWei
                5aRU/DbWtsQ47gjkv28Ekje3ob+6q0M+D5phwYDcv9ygYmuJ5wOi1cPprsWdFWmvSusCAwEAAaOBpzCBpDAd
                BgNVHQ4EFgQUzyBR9+vE8bygqvD6CZ/w6aQPikMwdQYDVR0jBG4wbIAUzyBR9+vE8bygqvD6CZ/w6aQPikOh
                SaRHMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRn
                aXRzIFB0eSBMdGSCCQDPA8UTbT4/dDAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUAA0EAIQuPLA/mlMJA
                MF680kL7reX5WgyRwAtRzJK6FgNjE7kRaLZQ79UKYVYa0VAyrRdoNEyVhG4tJFEiQJzaLWsl/A==
              </ds:X509Certificate>
            </ds:X509Data>
          </ds:KeyInfo>
        </ds:Signature>
        {subject ? (
          <saml:Subject>
            {subject.nameId ? (
              <saml:NameID
                Format="urn:oasis:names:tc:SAML:2.0:nameid-format:email"
                SPNameQualifier="http://localhost:9999/api/apps/7/saml/1/metadata.xml"
              >
                alex@example.com
              </saml:NameID>
            ) : null}
            {subject.loginId ? (
              <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
                <saml:SubjectConfirmationData
                  InResponseTo="id27748888-5253-48bf-8cf5-b65f793b7643"
                  NotOnOrAfter="2020-11-20T10:41:11.008603+00:00"
                  Recipient="http://localhost:9999/api/apps/7/saml/1/acs"
                />
              </saml:SubjectConfirmation>
            ) : null}
          </saml:Subject>
        ) : null}
        <saml:Conditions
          NotBefore="2020-11-20T10:23:11.008603+00:00"
          NotOnOrAfter="2020-11-20T10:41:11.008603+00:00"
        >
          <saml:AudienceRestriction>
            <saml:Audience>http://localhost:9999/api/apps/7/saml/1/metadata.xml</saml:Audience>
          </saml:AudienceRestriction>
        </saml:Conditions>
        <saml:AuthnStatement AuthnInstant="2020-11-20T10:26:11.008603+00:00">
          <saml:AuthnContext>
            <saml:AuthnContextClassRef>
              urn:oasis:names:tc:SAML:2.0:ac:classes:Password
            </saml:AuthnContextClassRef>
          </saml:AuthnContext>
        </saml:AuthnStatement>
        <saml:AttributeStatement>
          <saml:Attribute Name="foo" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
            <saml:AttributeValue>bar</saml:AttributeValue>
          </saml:Attribute>
        </saml:AttributeStatement>
      </saml:Assertion>
    </samlp:Response>
  );
  const xml = toXml(tree);
  const buf = Buffer.from(xml);
  return buf.toString('base64');
}

useTestDatabase(import.meta);

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
  secret = await AppSamlSecret.create({
    AppId: app.id,
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

describe('createAuthnRequest', () => {
  it('should generate SAML parameters', async () => {
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
    const samlRequest = inflated.toString('utf8');

    const loginRequest = await SamlLoginRequest.findOne();
    expect(loginRequest).toMatchObject({
      id: expect.any(String),
      AppSamlSecretId: secret.id,
      UserId: user.id,
      redirectUri: 'https://app.example',
      scope: 'email openid profile',
      state: 'secret state',
    });

    expect(samlRequest).toBe(
      '<samlp:AuthnRequest' +
        ' xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"' +
        ' AssertionConsumerServiceURL="http://localhost/api/apps/1/saml/1/acs"' +
        ' Destination="https://example.com/saml/login"' +
        ` ID="${loginRequest.id}"` +
        ' Version="2.0"' +
        ' IssueInstant="1970-01-01T00:00:00.000Z"' +
        ' xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"' +
        '>' +
        '<saml:Issuer>' +
        'http://localhost/api/apps/1/saml/1/metadata.xml' +
        '</saml:Issuer>' +
        '<samlp:NameIDPolicy' +
        ' Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"' +
        '/>' +
        '</samlp:AuthnRequest>',
    );
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

describe('assertConsumerService', () => {
  it('should handle an invalid relay state', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/saml/${secret.id}/acs`,
      new URLSearchParams({
        SAMLResponse: createSamlResponse(),
        RelayState: 'http://invalid.example',
      }),
    );

    expect(response).toMatchObject({
      status: 302,
      data: 'Redirecting to <a href="/saml/response/invalidrelaystate">/saml/response/invalidrelaystate</a>.',
    });
  });

  it('should handle if no secret can be found', async () => {
    const response = await request.post(
      '/api/apps/23/saml/93/acs',
      new URLSearchParams({
        SAMLResponse: createSamlResponse(),
        RelayState: 'http://localhost',
      }),
    );

    expect(response).toMatchObject({
      status: 302,
      data: 'Redirecting to <a href="/saml/response/invalidsecret">/saml/response/invalidsecret</a>.',
    });
  });

  it('should handle an invalid status code', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/saml/${secret.id}/acs`,
      new URLSearchParams({
        SAMLResponse: createSamlResponse({ statusCode: 'Any invalid string' }),
        RelayState: 'http://localhost',
      }),
    );

    expect(response).toMatchObject({
      status: 302,
      data: 'Redirecting to <a href="/saml/response/invalidstatuscode">/saml/response/invalidstatuscode</a>.',
    });
  });
});

describe('getEntityId', () => {
  it('should handle if no secret can be found', async () => {
    const response = await request.get('/api/apps/23/saml/93/metadata.xml');

    expect(response).toMatchObject({
      status: 404,
      data: { statusCode: 404, error: 'Not Found', message: 'SAML secret not found' },
    });
  });

  it('should serve the metadata XML', async () => {
    const response = await request.get(`/api/apps/${app.id}/saml/${secret.id}/metadata.xml`);

    expect(response).toMatchObject({
      status: 200,
      data:
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<md:EntityDescriptor' +
        ` entityID="http://localhost/api/apps/${app.id}/saml/${secret.id}/metadata.xml"` +
        ' xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"' +
        '>' +
        '<md:SPSSODescriptor' +
        ' AuthnRequestsSigned="true"' +
        ' protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"' +
        ' WantAssertionsSigned="true"' +
        '>' +
        '<md:KeyDescriptor' +
        ' use="signing"' +
        '>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '</md:KeyDescriptor>' +
        '<md:KeyDescriptor' +
        ' use="encryption"' +
        '>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '</md:KeyDescriptor>' +
        '<md:AssertionConsumerService' +
        ' Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"' +
        ` Location="http://localhost/api/apps/${app.id}/saml/${secret.id}/acs"` +
        '/>' +
        '</md:SPSSODescriptor>' +
        '</md:EntityDescriptor>',
    });
  });

  it('should ignore query parameters', async () => {
    const response = await request.get(`/api/apps/${app.id}/saml/${secret.id}/metadata.xml?foo=1`);

    expect(response).toMatchObject({
      status: 200,
      data:
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<md:EntityDescriptor' +
        ` entityID="http://localhost/api/apps/${app.id}/saml/${secret.id}/metadata.xml"` +
        ' xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"' +
        '>' +
        '<md:SPSSODescriptor' +
        ' AuthnRequestsSigned="true"' +
        ' protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"' +
        ' WantAssertionsSigned="true"' +
        '>' +
        '<md:KeyDescriptor' +
        ' use="signing"' +
        '>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '</md:KeyDescriptor>' +
        '<md:KeyDescriptor' +
        ' use="encryption"' +
        '>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '</md:KeyDescriptor>' +
        '<md:AssertionConsumerService' +
        ' Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"' +
        ` Location="http://localhost/api/apps/${app.id}/saml/${secret.id}/acs"` +
        '/>' +
        '</md:SPSSODescriptor>' +
        '</md:EntityDescriptor>',
    });
  });
});
