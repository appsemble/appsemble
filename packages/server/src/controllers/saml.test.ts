import { URL, URLSearchParams } from 'url';
import { promisify } from 'util';
import { inflateRaw } from 'zlib';

import { install, InstalledClock } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import toXml from 'xast-util-to-xml';
import x from 'xastscript';

import { App, AppSamlSecret, Organization, SamlLoginRequest, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let app: App;
let authorization: string;
let clock: InstalledClock;
let secret: AppSamlSecret;
let user: User;

const inflate = promisify(inflateRaw);

const idpCertificate = `-----BEGIN CERTIFICATE-----
MIICKzCCAdWgAwIBAgIJAM8DxRNtPj90MA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTEwODEyMjA1MTIzWhcNMTIwODExMjA1MTIzWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANcN
mgm4YlSUAr2xdWei5aRU/DbWtsQ47gjkv28Ekje3ob+6q0M+D5phwYDcv9ygYmuJ
5wOi1cPprsWdFWmvSusCAwEAAaOBpzCBpDAdBgNVHQ4EFgQUzyBR9+vE8bygqvD6
CZ/w6aQPikMwdQYDVR0jBG4wbIAUzyBR9+vE8bygqvD6CZ/w6aQPikOhSaRHMEUx
CzAJBgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRl
cm5ldCBXaWRnaXRzIFB0eSBMdGSCCQDPA8UTbT4/dDAMBgNVHRMEBTADAQH/MA0G
CSqGSIb3DQEBBQUAA0EAIQuPLA/mlMJAMF680kL7reX5WgyRwAtRzJK6FgNjE7kR
aLZQ79UKYVYa0VAyrRdoNEyVhG4tJFEiQJzaLWsl/A==
-----END CERTIFICATE-----
`;
const spCertificate = `-----BEGIN CERTIFICATE-----
MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRw
Oi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYx
MTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhv
c3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOC
AQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2Vx
ETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtm
d0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP
5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ
3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6
v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUA
A4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXF
cjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScS
J9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd
69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzk
x73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFw
MDm9VevTHL9rsmXufHriUcUP3z0I
-----END CERTIFICATE-----
`;
const spPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2Vx
ETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtm
d0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP
5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ
3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6
v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABAoIBADrfkvd/1zjpc/hZ
cBCxON2PRVJP0WcjRmqdsRYgirhSzbtsdPWpvzc6/vFFQ1Xj/iaze0QiARI9vSnZ
2KIXKEKhw2XJE88ziHxqmTJPPZq/t1JV8EN4gpAcIQRJTc1F/KCdZtNBIIosHzZs
b8KE1occQc5o3f4QKNveHMIYrKEXFyEBLsviC0d1N7NHXFuj4fpiIevmW/VKYgwQ
k8Q1RJaAUGMKFgniZWuot82LVnEii07hWlC7CQuHy1SLopdW/wa1yJIsIwN71uTV
jgmdIQ05AtxdAKyNE9HBQea0vmnoh2hgv+WDBAqHeY3EAxxL0y/Asmxbwi2flKIy
4W47b0kCgYEA6vshL7k1gqALlvRMrCOuv2DdlLP8fHA77eBBAx7zuSRLHl7KgguF
opWO723+zu5I7K33I/hZ/7shlFJVcLEtzCeQc1Evp8PKGdvyrMaYgmNqPEMODgna
0Mb0rJkKHea5XiKmAk6rB0bcEI6LtbFx4d8brguEM6pi8oPbP8EanEMCgYEAz4zY
U5+MbNIOEzx9ifupz6wxT7K1n8wH4i0tVC4aeJ0qO4dsnJzil8fXsZ673HhuJbxP
QfpDEjduukXeNgmo8fOScMSJB7+2G0NObUFMdVeWrHmgg9x6zGziYc2FTIeLU1JQ
Tm5z1LCNCAjAJINrvOOnzeRzmjciub3k6XgoanUCgYAZBPg5npzF9ciGICjxwzLe
CbBOHwPpNAINh+0kKe2FbwnYh/tD8XofH5GCiNGysshs+vDvkYfzpLcklcenIhZg
QG4u+Rv73urr6fFi2Bpw96jeFb2vXPlBdY2juv/Kw0BFd6b5Y+rt8WuJD8RsaiJY
DGtkErHW1nOGoud7WFI/BQKBgQCSmLcLibwT+OI8MBOz7G/q4YMK+f1TWzeOR76m
oNHNs6Tq2yKaFC3waxUsviOO+/lA6htJTM0nBsRNCaCEppoQG6ypvgfT01N7OjUg
8mhg0Xb5aAc6W/bYgWf9EL9AaNS+C3vxig6Cghl7PUMKB1GH33zc7qnAmYULkNcp
GNfjKQKBgQCI8uACJIeRSI+mk2clhX8Gip3Q9v9N7Xkqyzj3ooM+ZDesEzI/8iEj
6/KmfeI1Lkti0kno0ZjqHhzZ41VfMWsur7YrYSkK0+BX0ZbM2MPGedG+pkhfJ5J/
OlIQYsEyg3M1BRkKXgOm1oPvA/4zXGoIZ6xQMRE0BiO3uc0VCo0NNg==
-----END RSA PRIVATE KEY-----
`;
const spPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQd
DozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj1
8s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mK
a84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDO
g+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAM
gKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUo
nwIDAQAB
-----END PUBLIC KEY-----
`;

interface CreateSamlResponseOptions {
  statusCode?: string;
  subject?: { nameId?: string; loginId?: string };
  digest?: string;
}

/**
 * Create SAML response object for testing.
 *
 * The response was generated using `flask-saml2`. The response was then converted to hyperscript
 * using Babel.
 *
 * @param options - Options for the SAML response
 * @returns the base64 encoded SAML response object.
 */
function createSamlResponse({
  statusCode = 'urn:oasis:names:tc:SAML:2.0:status:Success',
  subject = { nameId: 'user@idp.example', loginId: 'id00000000-0000-0000-0000-000000000000' },
  digest = 'QZii75yFqDTK8/RwecJX1RFca8o=',
}: CreateSamlResponseOptions = {}): string {
  const tree = x(
    'samlp:Response',
    {
      'xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
      Destination: 'http://localhost:9999/api/apps/7/saml/1/acs',
      ID: '_5190f0683c9e4b77a4e0a8ffd4d4a4dd',
      InResponseTo: 'id27748888-5253-48bf-8cf5-b65f793b7643',
      IssueInstant: '2020-11-20T10:26:11.008603+00:00',
      Version: '2.0',
    },
    x(
      'saml:Issuer',
      { 'xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion' },
      'http://localhost:8000/saml/metadata.xml',
    ),
    x(
      'ds:Signature',
      { 'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#' },
      x(
        'ds:SignedInfo',
        null,
        x('ds:CanonicalizationMethod', { Algorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#' }),
        x('ds:SignatureMethod', { Algorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1' }),
        x(
          'ds:Reference',
          { URI: '#_5190f0683c9e4b77a4e0a8ffd4d4a4dd' },
          x(
            'ds:Transforms',
            null,
            x('ds:Transform', {
              Algorithm: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
            }),
            x('ds:Transform', { Algorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#' }),
          ),
          x('ds:DigestMethod', { Algorithm: 'http://www.w3.org/2000/09/xmldsig#sha1' }),
          x('ds:DigestValue', null, digest),
        ),
      ),
      x(
        'ds:SignatureValue',
        null,
        'GKQRfvJ0BR1geBqUttE6eXZCj9Ac+n1KPrN7R9odfrL8mXaU71aqW+rkNRCRV8NrY019bHDNDlWBpYDMLwsqcA==',
      ),
      x(
        'ds:KeyInfo',
        null,
        x(
          'ds:X509Data',
          null,
          x(
            'ds:X509Certificate',
            null,
            'MIICKzCCAdWgAwIBAgIJAM8DxRNtPj90MA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTEwODEyMjA1MTIzWhcNMTIwODExMjA1MTIzWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANcNmgm4YlSUAr2xdWei5aRU/DbWtsQ47gjkv28Ekje3ob+6q0M+D5phwYDcv9ygYmuJ5wOi1cPprsWdFWmvSusCAwEAAaOBpzCBpDAdBgNVHQ4EFgQUzyBR9+vE8bygqvD6CZ/w6aQPikMwdQYDVR0jBG4wbIAUzyBR9+vE8bygqvD6CZ/w6aQPikOhSaRHMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGSCCQDPA8UTbT4/dDAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUAA0EAIQuPLA/mlMJAMF680kL7reX5WgyRwAtRzJK6FgNjE7kRaLZQ79UKYVYa0VAyrRdoNEyVhG4tJFEiQJzaLWsl/A==',
          ),
        ),
      ),
    ),
    x('samlp:Status', null, x('samlp:StatusCode', { Value: statusCode })),
    x(
      'saml:Assertion',
      {
        'xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        ID: '_2d1e69f46b0b4e569928a2a0861ff2a4',
        IssueInstant: '2020-11-20T10:26:11.008603+00:00',
        Version: '2.0',
      },
      x('saml:Issuer', null, 'http://localhost:8000/saml/metadata.xml'),
      x(
        'ds:Signature',
        { 'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#' },
        x(
          'ds:SignedInfo',
          null,
          x('ds:CanonicalizationMethod', { Algorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#' }),
          x('ds:SignatureMethod', { Algorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1' }),
          x(
            'ds:Reference',
            { URI: '#_2d1e69f46b0b4e569928a2a0861ff2a4' },
            x(
              'ds:Transforms',
              null,
              x('ds:Transform', {
                Algorithm: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
              }),
              x('ds:Transform', { Algorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#' }),
            ),
            x('ds:DigestMethod', { Algorithm: 'http://www.w3.org/2000/09/xmldsig#sha1' }),
            x('ds:DigestValue', null, 'aeMoD3gP962UNfpc8Qxd0aAELMo='),
          ),
        ),
        x(
          'ds:SignatureValue',
          null,
          'Y+4rrPo0doC1Tos1zsGZJr7IgNtkbf4kVKE/Au/+RNCSSLrDSOur5D5Ic5cYMhRRzidZh1xqcxaliRjgXZK4Lg==',
        ),
        x(
          'ds:KeyInfo',
          null,
          x(
            'ds:X509Data',
            null,
            x(
              'ds:X509Certificate',
              null,
              'MIICKzCCAdWgAwIBAgIJAM8DxRNtPj90MA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTEwODEyMjA1MTIzWhcNMTIwODExMjA1MTIzWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANcNmgm4YlSUAr2xdWei5aRU/DbWtsQ47gjkv28Ekje3ob+6q0M+D5phwYDcv9ygYmuJ5wOi1cPprsWdFWmvSusCAwEAAaOBpzCBpDAdBgNVHQ4EFgQUzyBR9+vE8bygqvD6CZ/w6aQPikMwdQYDVR0jBG4wbIAUzyBR9+vE8bygqvD6CZ/w6aQPikOhSaRHMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIEwpTb21lLVN0YXRlMSEwHwYDVQQKExhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGSCCQDPA8UTbT4/dDAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUAA0EAIQuPLA/mlMJAMF680kL7reX5WgyRwAtRzJK6FgNjE7kRaLZQ79UKYVYa0VAyrRdoNEyVhG4tJFEiQJzaLWsl/A==',
            ),
          ),
        ),
      ),
      subject &&
        x(
          'saml:Subject',
          null,
          subject.nameId &&
            x(
              'saml:NameID',
              {
                Format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:email',
                SPNameQualifier: 'http://localhost:9999/api/apps/7/saml/1/metadata.xml',
              },
              'alex@example.com',
            ),
          subject.loginId &&
            x(
              'saml:SubjectConfirmation',
              { Method: 'urn:oasis:names:tc:SAML:2.0:cm:bearer' },
              x('saml:SubjectConfirmationData', {
                InResponseTo: 'id27748888-5253-48bf-8cf5-b65f793b7643',
                NotOnOrAfter: '2020-11-20T10:41:11.008603+00:00',
                Recipient: 'http://localhost:9999/api/apps/7/saml/1/acs',
              }),
            ),
        ),
      x(
        'saml:Conditions',
        {
          NotBefore: '2020-11-20T10:23:11.008603+00:00',
          NotOnOrAfter: '2020-11-20T10:41:11.008603+00:00',
        },
        x(
          'saml:AudienceRestriction',
          null,
          x('saml:Audience', null, 'http://localhost:9999/api/apps/7/saml/1/metadata.xml'),
        ),
      ),
      x(
        'saml:AuthnStatement',
        { AuthnInstant: '2020-11-20T10:26:11.008603+00:00' },
        x(
          'saml:AuthnContext',
          null,
          x('saml:AuthnContextClassRef', null, 'urn:oasis:names:tc:SAML:2.0:ac:classes:Password'),
        ),
      ),
      x(
        'saml:AttributeStatement',
        null,
        x(
          'saml:Attribute',
          { Name: 'foo', NameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic' },
          x('saml:AttributeValue', null, 'bar'),
        ),
      ),
    ),
  );
  const xml = toXml(tree);
  const buf = Buffer.from(xml);
  return buf.toString('base64');
}

beforeAll(createTestSchema('saml'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

beforeEach(() => {
  clock = install();
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
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
    idpCertificate,
    icon: '',
    name: '',
    spCertificate,
    spPrivateKey,
    spPublicKey,
  });
});

afterEach(truncate);

afterEach(() => {
  clock.uninstall();
});

afterAll(closeTestSchema);

describe('createAuthnRequest', () => {
  it('should generate SAML parameters', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/saml/${secret.id}/authn`,
      { redirectUri: 'https://app.example', scope: 'email openid profile', state: 'secret state' },
      { headers: { authorization } },
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
    const samlRequest = inflated.toString('utf-8');

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
        ' Version="2.0" IssueInstant="1970-01-01T00:00:00.000Z"' +
        ' IsPassive="true" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"' +
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
    const response = await request.post(
      '/api/apps/64/saml/26/authn',
      { redirectUri: 'https://app.example', scope: 'email openid profile', state: 'secret state' },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 404,
      data: { error: 'Not Found', message: 'App not found', statusCode: 404 },
    });
  });

  it('should throw if the SAML secret ID is invalid', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/saml/26/authn`,
      { redirectUri: 'https://app.example', scope: 'email openid profile', state: 'secret state' },
      { headers: { authorization } },
    );
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
      status: 400,
      data: { statusCode: 400, error: 'Bad Request', message: 'Invalid RelayState' },
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
      status: 404,
      data: { statusCode: 404, error: 'Not Found', message: 'SAML secret not found' },
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
      status: 400,
      data: { statusCode: 400, error: 'Bad Request', message: 'Status code is unsuccesful' },
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
        '<md:EntityDescriptor' +
        ' xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"' +
        ` entityID="http://localhost/api/apps/${app.id}/saml/${secret.id}/metadata.xml"` +
        '>' +
        '<md:SPSSODescriptor' +
        ' AuthnRequestsSigned="true"' +
        ' WantAssertionsSigned="true"' +
        ' protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"' +
        '>' +
        '<md:KeyDescriptor' +
        ' use="signing"' +
        '/>' +
        '<md:KeyDescriptor' +
        ' use="encryption"' +
        '/>' +
        '</md:SPSSODescriptor>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '<md:AssertionConsumerService' +
        ' Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"' +
        ` Location="http://localhost/api/apps/${app.id}/saml/${secret.id}/acs"` +
        '/>' +
        '</md:EntityDescriptor>',
    });
  });

  it('should ignore query parameters', async () => {
    const response = await request.get(`/api/apps/${app.id}/saml/${secret.id}/metadata.xml?foo=1`);

    expect(response).toMatchObject({
      status: 200,
      data:
        '<md:EntityDescriptor' +
        ' xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"' +
        ` entityID="http://localhost/api/apps/${app.id}/saml/${secret.id}/metadata.xml"` +
        '>' +
        '<md:SPSSODescriptor' +
        ' AuthnRequestsSigned="true"' +
        ' WantAssertionsSigned="true"' +
        ' protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"' +
        '>' +
        '<md:KeyDescriptor' +
        ' use="signing"' +
        '/>' +
        '<md:KeyDescriptor' +
        ' use="encryption"' +
        '/>' +
        '</md:SPSSODescriptor>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '<ds:KeyInfo' +
        ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#"' +
        '>' +
        '<ds:X509Data>' +
        '<ds:X509Certificate>' +
        'MIIC4TCCAcmgAwIBAgIBADANBgkqhkiG9w0BAQUFADA0MR4wHAYDVQQDExVodHRwOi8vbG9jYWxob3N0Ojk5OTkxEjAQBgNVBAoTCUFwcHNlbWJsZTAeFw0yMDExMDYxMTIxMjNaFw0zMDExMDYxMTIxMjNaMDQxHjAcBgNVBAMTFWh0dHA6Ly9sb2NhbGhvc3Q6OTk5OTESMBAGA1UEChMJQXBwc2VtYmxlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvoJXvGK6c3aWhA5qOqQdDozsSe8Ii01wtd3+joZs8X7rg2VxETZM47OUgw4gbH6Ar104aGxdvfp0w5sP8Dj18s3U8S3dpdEzz6cVqfobzt85oHtmd0GqbzDrNlgG27Uk4PgK1AZEUtOJd8+kK0mKa84B4RDHS62fm18s3MPN6r4YHqLP5WBuf2qjqXP9Glsro9SpwGF9a7Ufc1smtbDOg+zWLmVyXDfVOC1zfEek+TA+3PRQ3XVdXZKhiw49Afjc5MGUD08n3jESlc++XfAMgKuW6OUwMuE3Tvq1qqkdVZgYubA6v48ZAywfCl3GQ6qcXdF6nGGb0X3QYSR7GFUonwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQAFBSSUwb8TRSTun2ZKAI4bovsZ9yBd4Nx7DpBB1Lfiag1+vdrFOUZOUYXFcjoS/0Dpr8BSGWnSRB9ea9RiIOBOVIshtTPsapNmNLsR5NmkSCFGC2euAWybqScSJ9OH+HYXykXlY8p2AN6Y2ib5IeJYB03lepL32geDFsfuXoYZrEWxxcAChgy5CCtd69yO8GL8uW78Fr5X136m12+zacrQ+hmi7KBIGaqraSolpCUTJplc5f41AXjkJFzkx73C1Dw1O0acaz41CyyE7D0BXm7vWsXg7rHfHVoT3D4HjcRujIi1Oi5GqdyLAAFwMDm9VevTHL9rsmXufHriUcUP3z0I' +
        '</ds:X509Certificate>' +
        '</ds:X509Data>' +
        '</ds:KeyInfo>' +
        '<md:AssertionConsumerService' +
        ' Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"' +
        ` Location="http://localhost/api/apps/${app.id}/saml/${secret.id}/acs"` +
        '/>' +
        '</md:EntityDescriptor>',
    });
  });
});
