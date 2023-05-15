import { request, setTestApp } from 'axios-test-instance';

import { setArgv } from '../index.js';
import { App, Organization } from '../models/index.js';
import { createServer } from '../utils/createServer.js';
import { authorizeScim } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

let app: App;

useTestDatabase(import.meta);
vi.useFakeTimers().setSystemTime(new Date('2000-01-01'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
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
    scimToken,
  });
  authorizeScim(scimToken);
});

describe('getSCIMSchemas', () => {
  it('should fetch all SCIM schemas for an app', async () => {
    const response = await request.get(`/api/apps/${app.id}/scim/Schemas`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "attributes": [
              {
                "caseExact": true,
                "description": "The ID of the user on the SCIM client",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "externalId",
                "required": true,
                "returned": "always",
                "type": "string",
                "uniqueness": "global",
              },
              {
                "caseExact": true,
                "description": "The app member ID in Appsemble",
                "multiValued": false,
                "mutability": "immutable",
                "name": "id",
                "required": true,
                "returned": "always",
                "type": "string",
                "uniqueness": "global",
              },
              {
                "caseExact": true,
                "description": "The preferred locale of the user",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "locale",
                "required": false,
                "returned": "always",
                "type": "string",
                "uniqueness": "none",
              },
              {
                "caseExact": true,
                "description": "The user’s name",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "name",
                "required": false,
                "returned": "always",
                "subAttributes": [
                  {
                    "caseExact": true,
                    "description": "The user’s display name",
                    "multiValued": false,
                    "mutability": "readWrite",
                    "name": "formatted",
                    "required": false,
                    "returned": "always",
                    "type": "string",
                    "uniqueness": "none",
                  },
                ],
                "type": "complex",
                "uniqueness": "none",
              },
              {
                "caseExact": false,
                "description": "The preferred time zone of the user",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "timezone",
                "required": false,
                "returned": "always",
                "type": "string",
                "uniqueness": "none",
              },
              {
                "caseExact": false,
                "description": "The user’s display name",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "userName",
                "required": true,
                "returned": "always",
                "type": "string",
                "uniqueness": "none",
              },
            ],
            "description": "User Account",
            "id": "urn:ietf:params:scim:schemas:core:2.0:User",
            "meta": {
              "location": "http://localhost/api/apps/1/scim/schemas/urn:ietf:params:scim:schemas:core:2.0:User",
              "resourceType": "Schema",
            },
            "name": "User",
            "schemas": [
              "urn:ietf:params:scim:schemas:core:2.0:Schema",
            ],
          },
          {
            "attributes": [
              {
                "caseExact": true,
                "description": "The ID of the user on the SCIM client",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "manager",
                "required": true,
                "returned": "always",
                "type": "string",
                "uniqueness": "none",
              },
            ],
            "description": "Enterprise user account",
            "id": "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
            "meta": {
              "location": "http://localhost/api/apps/1/scim/schemas/urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
              "resourceType": "Schema",
            },
            "name": "User",
            "schemas": [
              "urn:ietf:params:scim:schemas:core:2.0:Schema",
            ],
          },
        ],
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "totalResults": 2,
      }
    `);
  });
});

describe('getSCIMSchema', () => {
  it('should fetch a SCIM schema for an app', async () => {
    const response = await request.get(
      `/api/apps/${app.id}/scim/Schemas/urn:ietf:params:scim:schemas:extension:enterprise:2.0:User`,
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "attributes": [
          {
            "caseExact": true,
            "description": "The ID of the user on the SCIM client",
            "multiValued": false,
            "mutability": "readWrite",
            "name": "manager",
            "required": true,
            "returned": "always",
            "type": "string",
            "uniqueness": "none",
          },
        ],
        "description": "Enterprise user account",
        "id": "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
        "meta": {
          "location": "http://localhost/api/apps/1/scim/schemas/urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
          "resourceType": "Schema",
        },
        "name": "User",
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:Schema",
        ],
      }
    `);
  });
});
