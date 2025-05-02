import { readFixture } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, type AppSamlSecret, getAppDB, Organization } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';

let app: App;
let secret: AppSamlSecret;

describe('getEntityId', () => {
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

  it('should handle if no app can be found', async () => {
    const response = await request.get('/api/apps/23/saml/93/metadata.xml');

    expect(response).toMatchObject({
      status: 404,
      data: { statusCode: 404, error: 'Not Found', message: 'App not found' },
    });
  });

  it('should handle if no secret can be found', async () => {
    const response = await request.get(`/api/apps/${app.id}/saml/93/metadata.xml`);

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
