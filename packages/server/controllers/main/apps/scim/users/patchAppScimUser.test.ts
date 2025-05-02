import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import { App, getAppDB, Organization, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('patchAppScimUser', () => {
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

  it.todo('should replace a bulk value', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: 'user@example.com',
      userId: user.id,
      role: 'User',
    });

    const response = await request.patch(`/api/apps/${app.id}/scim/Users/${member.id}`, {
      ScHeMaS: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      oPeRaTiOnS: [
        {
          oP: 'replace',
          value: {
            ExTeRnAlId: 'ptrk',
            UsErNaMe: 'patrick@krustykrab.example',
            'NaMe.FoRmAtTeD': 'Patrick Star',
            TiMeZoNe: 'Etc/UTC',
            locale: 'nl_NL',
          },
        },
      ],
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "active": false,
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

    await member.reload();
    expect(member).toMatchObject({
      AppId: app.id,
      email: 'patrick@krustykrab.example',
      id: response.data.id,
      name: 'Patrick Star',
      role: 'User',
      scimExternalId: 'ptrk',
    });
  });

  it.todo('should replace separate operations', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const { AppMember } = await getAppDB(app.id);
    const member = await AppMember.create({
      email: 'user@example.com',
      userId: user.id,
      role: 'User',
    });

    const response = await request.patch(`/api/apps/${app.id}/scim/Users/${member.id}`, {
      ScHeMaS: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      oPeRaTiOnS: [
        { op: 'replace', path: 'ExTeRnAlId', value: 'ptrk' },
        { op: 'replace', path: 'UsErNaMe', value: 'patrick@krustykrab.example' },
        { op: 'replace', path: 'NaMe.FoRmAtTeD', value: 'Patrick Star' },
        { op: 'replace', path: 'TiMeZoNe', value: 'Etc/UTC' },
        { op: 'replace', path: 'locale', value: 'nl_NL' },
        { op: 'replace', path: 'active', value: 'False' },
      ],
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "active": false,
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
