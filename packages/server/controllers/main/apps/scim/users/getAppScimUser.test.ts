import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, getAppDB, Organization, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('getAppScimUser', () => {
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
    const member = await AppMember.create({
      userId: user.id,
      email: 'user@example.com',
      role: 'User',
      timezone: 'Europe/Amsterdam',
    });

    const response = await request.get(`/api/apps/${app.id}/scim/Users/${member.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

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
      }
    `,
    );

    expect(response.data.id).toBe(member.id);
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

    const response = await request.get(`/api/apps/${app.id}/scim/Users/${member.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

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
      }
    `,
    );

    expect(response.data.id).toBe(member.id);
  });
});
