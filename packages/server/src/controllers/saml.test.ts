import { URL } from 'url';

import { install, InstalledClock } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';

import { App, AppSamlSecret, Organization, SamlLoginRequest, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let app: App;
let authorization: string;
let clock: InstalledClock;
let secret: AppSamlSecret;
let user: User;

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

jest.mock('uuid');

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
    idpCertificate: '-----BEGIN CERTIFICATE-----\nIDP\n-----END CERTIFICATE-----',
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
      SAMLRequest:
        'jVHbasMwDP2V4PckTnfpapJAWBkUulHabQ970xx1NfiSWU7p/n52ymB72BjIWByfoyNLNYHRg+jGcLBbfB+RQnYy2pJIDw0bvRUOSJGwYJBEkGLX3a/FrOACiNAH5SzLuq/01lkaDfod+qOS+LRdN+wQwiDKUjsJ+uAolDCoeAYqqzK5xAsksWwZzZWFVOYsoqjCE5hBYyGdOZO1e1PRcbVsmOp5Nbu4vLqe5zcLeM1lj/s8QXnCEpQQlj2jp6lo7DoqiUZcWQpgQ8OqxZxHTYxHzsUUBef8JfE28YfqiA0LfkT2bS7D34MZvAtOOs3aOrHF5Ojbf8zBYIAeAhTRqy6/i+vzoh6i2Wq5cVrJj+zOeQPh916qopoQ1ef7iSrQgNJd33skYmV7tvi5/vYT',
      Signature:
        'JsOpEMKEwrrDnwtuf8O/wonCocKIw5JWw4zDnsONW8KCwrvCiSfCj8OONcOPwqANWMK1wqoaw6V0R8O7Hh9YBsKIwocgwobDjsODw7ARwqIxw7PDmMO4GRrDmCvCkXzDv8KBw7R3w5NpGsKDGcKLwp7Doxhpwr3CrcOKw6TDsHTDti7Dr8KSwqscSMK4w6ggQcKVR8KRw5g1Y2tcw5Frw5jDksKyw7DCiMKbworDlFjDk8Odw6LDvnN8wpnCsWspwojCosOUUsKrP2dvw5rDrsKEw7J2wrvCrMKAMETDh0R7wpfDi8OICmDDiXYkwrbDsBEKF8ObwpXDrMO/FBzDksKJwqtIO8Obw5xowqnDqcOePVfCrsO+YsKAYhPDosOpw6HDjsKbO8Kdw6B5w7HCmnsZw5NZVgMzADttwpxBA0wGw4pXwpcwcsOfccOswpLDkMOJcn3DtyQpFMK3wr3DqArDkcKvw7rCggEfbWPCjsOhwpsGc3HDo03Dh8ODwrZkSmYiwpzCsGVnGRvDsw==',
    });

    const loginRequest = await SamlLoginRequest.findOne();
    expect(loginRequest).toMatchObject({
      id: 'id01234567-89ab-cdef-0123-456789abcdef',
      AppSamlSecretId: secret.id,
      UserId: user.id,
      redirectUri: 'https://app.example',
      scope: 'email openid profile',
      state: 'secret state',
    });
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
