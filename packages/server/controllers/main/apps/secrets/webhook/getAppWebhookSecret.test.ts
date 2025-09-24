import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

let app: App;
let user: User;
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getAppWebhookSecrets', () => {
  beforeAll(async () => {
    setArgv(argv);
    const server = await createServer({});
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          groups: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    authorizeStudio();
  });

  it('should get app webhook secret', async () => {
    const { AppWebhookSecret } = await getAppDB(app.id);
    const secret = await AppWebhookSecret.create({
      name: 'Test webhook',
      webhookName: 'test',
      secret: 'c6a5e780dee8e2f1f576538c8',
    });

    const response = await request.get(`/api/apps/${app.id}/secrets/webhook/${secret.id}`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "secret": "63366135653738306465653865326631663537363533386338",
      }
    `);
  });
});
