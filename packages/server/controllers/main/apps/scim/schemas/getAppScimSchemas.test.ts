import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, Organization } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('getAppScimSchemas', () => {
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
                "description": "A boolean indicating whether or not the user is active",
                "multiValued": false,
                "mutability": "readWrite",
                "name": "active",
                "required": true,
                "returned": "always",
                "type": "boolean",
                "uniqueness": "none",
              },
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
