import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { toXml } from 'xast-util-to-xml';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { x as h } from 'xastscript';

import { App, type AppSamlSecret, getAppDB, Organization } from '../../../../models/index.js';
import { type CreateSamlResponseOptions } from '../../../../types/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let app: App;
let secret: AppSamlSecret;

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

describe('assertAppSamlConsumerService', () => {
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
    await createTestUser();
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

  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should authorize new app member and redirect with valid code', async () => {
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

  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should reuse existing authorization', async () => {
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

  // eslint-disable-next-line vitest/no-disabled-tests
  it.skip('should handle conflicts', async () => {
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
      `/api/apps/${app.id}/saml/93/acs`,
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
    authorizeStudio();
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
