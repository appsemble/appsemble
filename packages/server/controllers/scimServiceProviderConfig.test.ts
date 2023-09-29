import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../index.js';
import { App, Organization } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { encrypt } from '../utils/crypto.js';
import { authorizeScim } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;

useTestDatabase(import.meta);
vi.useFakeTimers().setSystemTime(new Date('2000-01-01'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'test' });
  const server = await createServer();
  request.defaults.headers['content-type'] = 'application/scim+json';
  await setTestApp(server);
});

beforeEach(async () => {
  const organization = await Organization.create({ id: 'testorganization' });
  const scimToken = 'test';
  app = await App.create({
    definition: {},
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: organization.id,
    scimEnabled: true,
    scimToken: encrypt(scimToken, argv.aesSecret),
  });
  authorizeScim(scimToken);
});

describe('getSCIMServiceProviderConfig', () => {
  it('should fetch all SCIM schemas for an app', async () => {
    const response = await request.get(`/api/apps/${app.id}/scim/ServiceProviderConfig`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "authenticationSchemes": [
          {
            "description": "",
            "name": "HTTPBasic",
            "type": "httpbasic",
          },
        ],
        "bulk": {
          "maxOperations": 9007199254740991,
          "maxPayloadSize": 9007199254740991,
          "supported": false,
        },
        "changePassword": {
          "supported": false,
        },
        "etag": {
          "supported": false,
        },
        "filter": {
          "maxResults": 9007199254740991,
          "supported": false,
        },
        "patch": {
          "supported": true,
        },
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig",
        ],
        "sort": {
          "supported": false,
        },
      }
    `);
  });
});
