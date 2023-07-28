import { request, setTestApp } from 'axios-test-instance';

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

describe('getSCIMResourceTypes', () => {
  it('should fetch all SCIM schemas for an app', async () => {
    const response = await request.get(`/api/apps/${app.id}/scim/ResourceTypes`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "description": "https://tools.ietf.org/html/rfc7643#section-8.7.1",
            "endpoint": "http://localhost/api/apps/1/scim/Users",
            "id": "User",
            "meta": {
              "location": "http://localhost/api/apps/1/scim/ResourceTypes/User",
              "resourceType": "ResourceType",
            },
            "name": "User",
            "schema": "urn:ietf:params:scim:schemas:core:2.0:User",
            "schemaExtensions": [
              {
                "required": false,
                "schema": "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
              },
            ],
            "schemas": [
              "urn:ietf:params:scim:schemas:core:2.0:ResourceType",
            ],
          },
        ],
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "totalResults": 1,
      }
    `);
  });
});

describe('getSCIMResourceType', () => {
  it('should fetch a SCIM schema for an app', async () => {
    const response = await request.get(`/api/apps/${app.id}/scim/getSCIMResourceTypes/User`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "URL not found",
        "statusCode": 404,
      }
    `);
  });
});
