import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, getAppDB, Organization, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('updateAppScimUser', () => {
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

  it.todo('should update a user and app member', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    const member = await AppMember.create({
      userId: user.id,
      email: 'user@example.com',
      role: 'User',
    });

    const response = await request.put(`/api/apps/${app.id}/scim/Users/${member.id}`, {
      ScHeMaS: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      ExTeRnAlId: 'ptrk',
      UsErNaMe: 'patrick@krustykrab.example',
      active: true,
      MeTa: {
        ReSoUrCeTyPe: 'User',
      },
      NaMe: {
        FoRmAtTeD: 'Patrick Star',
      },
      TiMeZoNe: 'Etc/UTC',
      locale: 'nl_NL',
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "active": true,
        "externalId": "ptrk",
        "id": Any<String>,
        "locale": "nl_NL",
        "meta": {
          "created": "2000-01-01T00:00:00.000Z",
          "lastModified": "2000-01-01T00:00:00.000Z",
          "location": Any<String>,
          "resourceType": "User",
        },
        "name": {
          "formatted": "Patrick Star",
        },
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:User",
          "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
        ],
        "timezone": "Etc/UTC",
        "userName": "patrick@krustykrab.example",
      }
    `,
    );

    await member.reload({ include: User });
    expect(member).toMatchObject({
      AppId: app.id,
      User: {
        locale: 'nl_NL',
        name: 'Patrick Star',
        timezone: 'Etc/UTC',
      },
      email: 'patrick@krustykrab.example',
      id: response.data.id,
      name: 'Patrick Star',
      role: 'User',
      scimExternalId: 'ptrk',
    });
  });
});
