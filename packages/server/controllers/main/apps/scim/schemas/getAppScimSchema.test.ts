import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, Organization } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('getAppScimSchema', () => {
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
