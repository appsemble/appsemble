import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, getAppDB, Organization, OrganizationMember } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { encrypt } from '../../../utils/crypto.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
const ordersApi = {
  name: 'Orders API',
  urlPatterns: 'https://orders.example',
  authenticationMethod: 'custom-header',
  identifier: 'Authorization',
};
const stockApi = {
  urlPatterns: 'https://stock.example',
  authenticationMethod: 'custom-header',
  identifier: 'Authorization',
};
const oauth2 = {
  authorizationUrl: 'https://example.com/oauth/authorize',
  clientId: 'example_client_id',
  icon: 'key',
  scope: 'openid',
  tokenUrl: 'https://example.com/oauth/token',
};

let app: App;
let member: OrganizationMember;

describe('getAppWarnings', () => {
  beforeAll(async () => {
    setArgv(argv);
    await setTestApp(await createServer());
  });

  beforeEach(async () => {
    const user = await createTestUser();
    const organization = await Organization.create({ id: 'testorganization' });
    member = await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    app = await App.create({
      OrganizationId: organization.id,
      definition: {},
      vapidPublicKey: '',
      vapidPrivateKey: '',
      scimEnabled: true,
    });
    authorizeStudio();
  });

  it('should list the secrets without a value until they get one', async () => {
    const { AppOAuth2Secret, AppServiceSecret } = await getAppDB(app.id);
    const orders = await AppServiceSecret.create(ordersApi);
    const stock = await AppServiceSecret.create(stockApi);
    await AppServiceSecret.create({
      name: 'Complete API',
      urlPatterns: 'https://complete.example',
      authenticationMethod: 'custom-header',
      identifier: 'Authorization',
      secret: encrypt('complete-api-key', argv.aesSecret),
    });
    const login = await AppOAuth2Secret.create({ ...oauth2, clientSecret: '', name: 'Login' });
    await AppOAuth2Secret.create({ ...oauth2, clientSecret: 'complete', name: 'Complete login' });

    const before = await request.get(`/api/apps/${app.id}/warnings`);

    await request.put(`/api/apps/${app.id}/secrets/service/${orders.id}`, {
      ...ordersApi,
      secret: 'orders-api-key',
    });
    await request.put(`/api/apps/${app.id}/secrets/service/${stock.id}`, {
      ...stockApi,
      secret: 'stock-api-key',
    });
    await request.put(`/api/apps/${app.id}/secrets/oauth2/${login.id}`, {
      ...oauth2,
      clientSecret: 'client-secret',
      name: 'Login',
    });
    await request.patch(`/api/apps/${app.id}/secrets/scim`, { token: 'scim-token' });
    const after = await request.get(`/api/apps/${app.id}/warnings`);

    expect({ before: before.data, after: after.data }).toStrictEqual({
      before: [
        { code: 'missing-secret', type: 'service', id: orders.id, name: 'Orders API' },
        { code: 'missing-secret', type: 'service', id: stock.id, name: 'https://stock.example' },
        { code: 'missing-secret', type: 'oauth2', id: login.id, name: 'Login' },
        { code: 'missing-secret', type: 'scim', name: 'SCIM' },
      ],
      after: [],
    });
  });

  it('should only list the SCIM token while SCIM is enabled', async () => {
    await app.update({ scimEnabled: false });

    const response = await request.get(`/api/apps/${app.id}/warnings`);

    expect(response.data).toStrictEqual([]);
  });

  it('should require permission to query the app secrets', async () => {
    await member.update({ role: PredefinedOrganizationRole.Member });

    const response = await request.get(`/api/apps/${app.id}/warnings`);

    expect(response.status).toBe(403);
  });
});
