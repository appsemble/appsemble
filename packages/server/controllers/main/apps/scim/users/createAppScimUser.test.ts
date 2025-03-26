import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { setArgv } from '../../../../../index.js';
import {
  App,
  AppMember,
  Group,
  GroupMember,
  Organization,
  User,
} from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { encrypt } from '../../../../../utils/crypto.js';
import { authorizeScim } from '../../../../../utils/test/authorization.js';

let app: App;

describe('createAppScimUser', () => {
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

  it.todo('should create a user and app member', async () => {
    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      ScHeMaS: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      ExTeRnAlId: 'spgb',
      UsErNaMe: 'spongebob@krustykrab.example',
      active: true,
      MeTa: {
        ReSoUrCeTyPe: 'User',
      },
      NaMe: {
        FoRmAtTeD: 'Spongebob Squarepants',
      },
      TiMeZoNe: 'Etc/UTC',
      locale: 'nl_NL',
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/scim+json

      {
        "active": true,
        "externalId": "spgb",
        "id": Any<String>,
        "locale": "nl_NL",
        "meta": {
          "created": "2000-01-01T00:00:00.000Z",
          "lastModified": "2000-01-01T00:00:00.000Z",
          "location": Any<String>,
          "resourceType": "User",
        },
        "name": {
          "formatted": "Spongebob Squarepants",
        },
        "schemas": [
          "urn:ietf:params:scim:schemas:core:2.0:User",
          "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
        ],
        "timezone": "Etc/UTC",
        "userName": "spongebob@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id);
    expect(member).toMatchObject({
      AppId: app.id,
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      name: 'Spongebob Squarepants',
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it.todo('should throw an error when app has no roles', async () => {
    app.update({
      definition: {
        security: null,
      },
    });

    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      ScHeMaS: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      ExTeRnAlId: 'spgb',
      UsErNaMe: 'spongebob@krustykrab.example',
      active: true,
      MeTa: {
        ReSoUrCeTyPe: 'User',
      },
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "App does not have a security definition in place to handle SCIM users. See SCIM documentation for more info.",
        "statusCode": 400,
      }
    `);
  });

  it.todo('should accept partial data', async () => {
    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      sChEmAs: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      uSeRnAmE: 'spongebob@krustykrab.example',
      eXtErNaLiD: 'spgb',
      active: true,
      mEtA: {
        rEsOuRcEtYpE: 'User',
      },
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/scim+json

      {
        "active": true,
        "externalId": "spgb",
        "id": Any<String>,
        "locale": "en",
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
        "userName": "spongebob@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id);
    expect(member).toMatchObject({
      AppId: app.id,
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it.todo('should create a group matching the manager id', async () => {
    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      sChEmAs: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      uSeRnAmE: 'spongebob@krustykrab.example',
      eXtErNaLiD: 'spgb',
      active: true,
      mEtA: {
        rEsOuRcEtYpE: 'User',
      },
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
        mAnAgEr: 'krbs',
      },
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/scim+json

      {
        "active": true,
        "externalId": "spgb",
        "id": Any<String>,
        "locale": "en",
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
        "userName": "spongebob@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id, {
      include: [
        {
          model: GroupMember,
          include: [Group],
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      GroupMembers: [
        {
          Group: { name: 'krbs' },
          role: 'member',
          GroupId: 1,
        },
      ],
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it.todo('should add members to an existing group matching the manager id', async () => {
    const group = await Group.create({ AppId: app.id, name: 'krbs' });

    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      sChEmAs: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      uSeRnAmE: 'spongebob@krustykrab.example',
      eXtErNaLiD: 'spgb',
      active: true,
      mEtA: {
        rEsOuRcEtYpE: 'User',
      },
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
        mAnAgEr: 'krbs',
      },
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/scim+json

      {
        "active": true,
        "externalId": "spgb",
        "id": Any<String>,
        "locale": "en",
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
        "userName": "spongebob@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id, {
      include: [
        {
          model: GroupMember,
          include: [Group],
        },
      ],
    });

    expect(member).toMatchObject({
      AppId: app.id,
      GroupMembers: [
        {
          GroupId: group.id,
        },
      ],
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it.todo('should make members manager of a group matching their id', async () => {
    const group = await Group.create({ AppId: app.id, name: 'krbs' });

    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      sChEmAs: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      uSeRnAmE: 'krabs@krustykrab.example',
      active: true,
      eXtErNaLiD: 'krbs',
      mEtA: {
        rEsOuRcEtYpE: 'User',
      },
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 201 Created
      Content-Type: application/scim+json

      {
        "active": true,
        "externalId": "krbs",
        "id": Any<String>,
        "locale": "en",
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
        "userName": "krabs@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id, {
      include: [
        {
          model: GroupMember,
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      GroupMembers: [
        {
          GroupId: group.id,
          role: 'manager',
        },
      ],
      email: 'krabs@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'krbs',
    });
  });

  it.todo(
    'should assign manager to group that was created before their group’s creation, with the appropriate role',
    async () => {
      const user = await User.create({ timezone: '' });
      const appMember = await AppMember.create({
        UserId: user.id,
        email: 'user@example.com',
        AppId: app.id,
        role: 'User',
        scimExternalId: 'krbs',
        timezone: 'Europe/Amsterdam',
      });

      await request.post(`/api/apps/${app.id}/scim/Users`, {
        sChEmAs: [
          'urn:ietf:params:scim:schemas:core:2.0:User',
          'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
        ],
        uSeRnAmE: 'spgb@krustykrab.example',
        eXtErNaLiD: 'spgb',
        active: true,
        mEtA: {
          rEsOuRcEtYpE: 'User',
        },
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
          mAnAgEr: 'krbs',
        },
      });
      const result = (await Group.findOne({
        where: { AppId: app.id, name: appMember.scimExternalId },
      }).then((group) =>
        GroupMember.findOne({ where: { GroupId: group!.id, AppMemberId: appMember.id } }),
      ))!;

      expect(result.role).toBe('manager');
    },
  );
});
