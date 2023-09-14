import { TeamRole } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';

import { setArgv } from '../index.js';
import { App, AppMember, Organization, Team, TeamMember, User } from '../models/index.js';
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

describe('createSCIMUser', () => {
  it('should create a user and app member', async () => {
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

    const member = await AppMember.findByPk(response.data.id, { include: [User] });
    expect(member).toMatchObject({
      AppId: app.id,
      User: {
        locale: 'nl_NL',
        name: 'Spongebob Squarepants',
        timezone: 'Etc/UTC',
      },
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      name: 'Spongebob Squarepants',
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it('should accept partial data', async () => {
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

    const member = await AppMember.findByPk(response.data.id, { include: [User] });
    expect(member).toMatchObject({
      AppId: app.id,
      User: {
        locale: 'en',
        timezone: 'Europe/Amsterdam',
      },
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it('should create a team matching the manager id', async () => {
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
          model: TeamMember,
          include: [Team],
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      TeamMembers: [
        {
          Team: { name: 'krbs' },
          role: 'member',
          TeamId: 1,
        },
      ],
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it('should add members to an existing team matching the manager id', async () => {
    const team = await Team.create({ AppId: app.id, name: 'krbs' });

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
          model: TeamMember,
          include: [Team],
        },
      ],
    });

    expect(member).toMatchObject({
      AppId: app.id,
      TeamMembers: [
        {
          TeamId: team.id,
        },
      ],
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it('should make members manager of a team matching their id', async () => {
    const team = await Team.create({ AppId: app.id, name: 'krbs' });

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
          model: TeamMember,
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      TeamMembers: [
        {
          TeamId: team.id,
          role: 'manager',
        },
      ],
      email: 'krabs@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'krbs',
    });
  });

  it('should assign manager to team that was created before their team’s creation, with the appropriate role', async () => {
    const user = await User.create({ timezone: '' });
    const appMember = await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      role: 'User',
      scimExternalId: 'krbs',
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
    const result = await Team.findOne({
      where: { AppId: app.id, name: appMember.scimExternalId },
    }).then((team) =>
      TeamMember.findOne({ where: { TeamId: team.id, AppMemberId: appMember.id } }),
    );

    expect(result.role).toBe('manager');
  });
});

describe('getSCIMUser', () => {
  it('should return a SCIM user', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

    const response = await request.get(`/api/apps/${app.id}/scim/Users/${member.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "active": null,
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
      }
    `,
    );

    expect(response.data.id).toBe(member.id);
  });

  it('should return a SCIM user with manager', async () => {
    const team = await Team.create({ AppId: app.id, name: 'krbs' });
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });
    await TeamMember.create({ TeamId: team.id, AppMemberId: member.id });

    const response = await request.get(`/api/apps/${app.id}/scim/Users/${member.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "active": null,
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
      }
    `,
    );

    expect(response.data.id).toBe(member.id);
  });
});

describe('getSCIMUsers', () => {
  it('should return a SCIM user', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

    const response = await request.get(`/api/apps/${app.id}/scim/Users`);
    expect(response).toMatchInlineSnapshot(
      { data: { Resources: [{ id: expect.any(String), meta: { location: expect.any(String) } }] } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "active": null,
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

  it('should return a SCIM user with manager', async () => {
    const team = await Team.create({ AppId: app.id, name: 'krbs' });
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });
    await TeamMember.create({ TeamId: team.id, AppMemberId: member.id });

    const response = await request.get(`/api/apps/${app.id}/scim/Users`);

    expect(response).toMatchInlineSnapshot(
      { data: { Resources: [{ id: expect.any(String), meta: { location: expect.any(String) } }] } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
            "active": null,
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

  it('should return a SCIM user based on querying their username', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
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
            "active": null,
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

  it('should return empty resources when user is not found', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

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

describe('updateSCIMUser', () => {
  it('should update a user and app member', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

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

describe('patchSCIMUser', () => {
  it('should replace a bulk value', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

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
        "active": null,
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

  it('should replace separate operations', async () => {
    const user = await User.create({ timezone: 'Europe/Amsterdam' });
    const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

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

it("should create a team if the user contains a manager ID of a team that doesn't exist yet", async () => {
  const user = await User.create({ timezone: 'Europe/Amsterdam' });
  const member = await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });

  await request.patch(`/api/apps/${app.id}/scim/Users/${member.id}`, {
    ScHeMaS: [
      'urn:ietf:params:scim:schemas:core:2.0:User',
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    ],
    oPeRaTiOnS: [
      {
        op: 'add',
        path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager',
        value: 'krbs',
      },
    ],
  });

  const team = await Team.findOne({ where: { AppId: app.id, name: 'krbs' } });

  expect(team).toMatchObject({
    AppId: 1,
    annotations: null,
    id: 1,
    name: 'krbs',
  });
});

it('should add member to an existing team if the user contains a manager ID of a team that already exists', async () => {
  const user1 = await User.create({ timezone: 'Europe/Amsterdam' });
  const user2 = await User.create({ timezone: 'Europe/Amsterdam' });
  const member1 = await AppMember.create({ AppId: app.id, UserId: user1.id, role: 'User' });
  const member2 = await AppMember.create({ AppId: app.id, UserId: user2.id, role: 'User' });
  const team = await Team.create({ AppId: app.id, name: member1.id });
  await TeamMember.create({ TeamId: team.id, AppMemberId: member1.id, role: 'manager' });

  await request.patch(`/api/apps/${app.id}/scim/Users/${member2.id}`, {
    ScHeMaS: [
      'urn:ietf:params:scim:schemas:core:2.0:User',
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    ],
    oPeRaTiOnS: [
      {
        op: 'add',
        path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager',
        value: member1.id,
      },
    ],
  });

  const result = await TeamMember.findOne({
    where: { TeamId: team.id, AppMemberId: member2.id },
  });

  expect(result).toMatchObject({
    AppMemberId: member2.id,
    TeamId: 1,
    role: TeamRole.Member,
  });
});

it('should assign existing manager to new team as manager', async () => {
  const user1 = await User.create({ timezone: 'Europe/Amsterdam' });
  const user2 = await User.create({ timezone: 'Europe/Amsterdam' });
  const member1 = await AppMember.create({ AppId: app.id, UserId: user1.id, role: 'User' });
  const member2 = await AppMember.create({ AppId: app.id, UserId: user2.id, role: 'User' });

  await request.patch(`/api/apps/${app.id}/scim/Users/${member1.id}`, {
    ScHeMaS: [
      'urn:ietf:params:scim:schemas:core:2.0:User',
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    ],
    oPeRaTiOnS: [
      {
        op: 'add',
        path: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:manager',
        value: member2.id,
      },
    ],
  });

  const result = await TeamMember.findOne({
    where: { AppMemberId: member2.id },
    include: [{ model: Team, where: { AppId: app.id } }],
  });

  expect(result).toMatchObject({
    AppMemberId: member2.id,
    TeamId: 1,
    role: TeamRole.Manager,
  });
}, 50_000);
