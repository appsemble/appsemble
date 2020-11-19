import { request, setTestApp } from 'axios-test-instance';

import { App, Member, Organization, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let app: App;
let authorization: string;
let user: User;

beforeAll(createTestSchema('appnotifications'));

beforeAll(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  await setTestApp(server);
});

afterEach(truncate);

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
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Owner' });
});

afterAll(closeTestSchema);

describe('createSamlSecret', () => {
  it('should generate SAML parameters', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/secrets/saml`,
      {
        entityId: 'https://example.com/saml/metadata.xml',
        acsUrl: 'https://example.com/saml/acs',
        ssoUrl: 'https://example.com/saml/login',
        idpCertificate: '',
        icon: '',
        name: '',
      },
      { headers: { authorization } },
    );
    expect(response).toMatchObject({
      status: 201,
      data: {
        AppId: app.id,
        entityId: 'https://example.com/saml/metadata.xml',
        icon: '',
        id: 1,
        idpCertificate: '',
        name: '',
        spCertificate: expect.any(String),
        spPublicKey: expect.any(String),
        ssoUrl: 'https://example.com/saml/login',
      },
    });
  });
});
