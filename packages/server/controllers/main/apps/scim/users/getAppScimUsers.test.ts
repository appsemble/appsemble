import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, getAppDB, Organization, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('getAppScimUsers', () => {
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
      definition: {
        security: {
          default: {
            role: 'User',
            policy: 'everyone',
          },
          roles: {
            User: { description: 'Default SCIM User for testing.' },
          },
        },
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      scimEnabled: true,
      scimToken: encrypt(scimToken, argv.aesSecret),
    });
    authorizeScim(scimToken);
  });

  it.todo('should return a SCIM user', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user.id,
      email: 'user@example.com',
      role: 'User',
      timezone: 'Europe/Amsterdam',
    });

    const response = await request.get(`/api/apps/${app.id}/scim/Users`);
    expect(response).toMatchInlineSnapshot(
      { data: { Resources: [{ id: expect.any(String), meta: { location: expect.any(String) } }] } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "active": false,
            "externalId": null,
            "id": Any<String>,
            "locale": null,
            "meta": {
              "created": "2000-01-01T00:00:00.000Z",
              "lastModified": "2000-01-01T00:00:00.000Z",
              "location": Any<String>,
              "resourceType": "User",
            },
            "schemas": [
              "urn:ietf:params:scim:schemas:core:2.0:User",
              "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
            ],
            "timezone": "Europe/Amsterdam",
            "userName": "user@example.com",
          },
        ],
        "itemsPerPage": 1,
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "startIndex": 1,
        "totalResults": 1,
      }
    `,
    );
  });

  it.todo('should return a SCIM user with manager', async () => {
    const { AppMember, Group, GroupMember } = await getAppDB(app.id);
    const group = await Group.create({ name: 'krbs' });
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({
      userId: user.id,
      email: 'user@example.com',
      role: 'User',
    });
    await GroupMember.create({ GroupId: group.id, AppMemberId: member.id });

    const response = await request.get(`/api/apps/${app.id}/scim/Users`);

    expect(response).toMatchInlineSnapshot(
      { data: { Resources: [{ id: expect.any(String), meta: { location: expect.any(String) } }] } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "active": false,
            "externalId": null,
            "id": Any<String>,
            "locale": null,
            "meta": {
              "created": "2000-01-01T00:00:00.000Z",
              "lastModified": "2000-01-01T00:00:00.000Z",
              "location": Any<String>,
              "resourceType": "User",
            },
            "schemas": [
              "urn:ietf:params:scim:schemas:core:2.0:User",
              "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
            ],
            "timezone": "Europe/Amsterdam",
            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
              "manager": {
                "value": "krbs",
              },
            },
            "userName": "user@example.com",
          },
        ],
        "itemsPerPage": 1,
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "startIndex": 1,
        "totalResults": 1,
      }
    `,
    );
  });

  it.todo('should return a SCIM user based on querying their username', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user.id,
      role: 'User',
      email: 'example@hotmail.com',
    });

    const response = await request.get(
      `/api/apps/${app.id}/scim/Users?filter=uSeRnAmE Eq "eXaMpLe@HoTmAIl.CoM"`,
    );

    expect(response).toMatchInlineSnapshot(
      { data: { Resources: [{ id: expect.any(String), meta: { location: expect.any(String) } }] } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "active": false,
            "externalId": null,
            "id": Any<String>,
            "locale": null,
            "meta": {
              "created": "2000-01-01T00:00:00.000Z",
              "lastModified": "2000-01-01T00:00:00.000Z",
              "location": Any<String>,
              "resourceType": "User",
            },
            "schemas": [
              "urn:ietf:params:scim:schemas:core:2.0:User",
              "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
            ],
            "timezone": "Europe/Amsterdam",
            "userName": "example@hotmail.com",
          },
        ],
        "itemsPerPage": 1,
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "startIndex": 1,
        "totalResults": 1,
      }
    `,
    );
  });

  it.todo('should return empty resources when user is not found', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    await AppMember.create({
      userId: user.id,
      email: 'user@example.com',
      role: 'User',
      timezone: 'Europe/Amsterdam',
    });

    const response = await request.get(`/api/apps/${app.id}/scim/Users?filter=uSeRnAmE eQ ""`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [],
        "itemsPerPage": 0,
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "startIndex": 1,
        "totalResults": 0,
      }
    `);
  });
});
