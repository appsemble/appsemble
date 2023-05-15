import { request, setTestApp } from 'axios-test-instance';

import { setArgv } from '../index.js';
import { App, AppMember, Organization, Team, TeamMember, User } from '../models/index.js';
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

describe('createSCIMUser', () => {
  it('should create a user and app member', async () => {
    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      ScHeMaS: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      ExTeRnAlId: 'spgb',
      UsErNaMe: 'spongebob@krustykrab.example',
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
          "manager": "krbs",
        },
        "userName": "spongebob@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id, {
      include: [
        {
          model: User,
          include: [
            {
              model: TeamMember,
              include: [Team],
            },
          ],
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      User: {
        TeamMembers: [{ Team: { name: 'krbs' } }],
        locale: 'en',
        timezone: 'Europe/Amsterdam',
      },
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it('should add users to an existing team matching the manager id', async () => {
    const team = await Team.create({ AppId: app.id, name: 'krbs' });

    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      sChEmAs: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      uSeRnAmE: 'spongebob@krustykrab.example',
      eXtErNaLiD: 'spgb',
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
          "manager": "krbs",
        },
        "userName": "spongebob@krustykrab.example",
      }
    `,
    );

    const member = await AppMember.findByPk(response.data.id, {
      include: [
        {
          model: User,
          include: [
            {
              model: TeamMember,
              include: [Team],
            },
          ],
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      User: {
        TeamMembers: [{ TeamId: team.id }],
        locale: 'en',
        timezone: 'Europe/Amsterdam',
      },
      email: 'spongebob@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'spgb',
    });
  });

  it('should make users manager of a team matching their id', async () => {
    const team = await Team.create({ AppId: app.id, name: 'krbs' });

    const response = await request.post(`/api/apps/${app.id}/scim/Users`, {
      sChEmAs: [
        'urn:ietf:params:scim:schemas:core:2.0:User',
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
      ],
      uSeRnAmE: 'krabs@krustykrab.example',
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
          model: User,
          include: [
            {
              model: TeamMember,
              include: [Team],
            },
          ],
        },
      ],
    });
    expect(member).toMatchObject({
      AppId: app.id,
      User: {
        TeamMembers: [{ TeamId: team.id, role: 'manager' }],
        locale: 'en',
        timezone: 'Europe/Amsterdam',
      },
      email: 'krabs@krustykrab.example',
      id: response.data.id,
      role: 'User',
      scimExternalId: 'krbs',
    });
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
    await TeamMember.create({ TeamId: team.id, UserId: user.id });

    const response = await request.get(`/api/apps/${app.id}/scim/Users/${member.id}`);

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
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
          "manager": "krbs",
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
        "itemsPerPage": 50,
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
    await AppMember.create({ AppId: app.id, UserId: user.id, role: 'User' });
    await TeamMember.create({ TeamId: team.id, UserId: user.id });

    const response = await request.get(`/api/apps/${app.id}/scim/Users`);

    expect(response).toMatchInlineSnapshot(
      { data: { Resources: [{ id: expect.any(String), meta: { location: expect.any(String) } }] } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/scim+json

      {
        "Resources": [
          {
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
              "manager": "krbs",
            },
          },
        ],
        "itemsPerPage": 50,
        "schemas": [
          "urn:ietf:params:scim:api:messages:2.0:ListResponse",
        ],
        "startIndex": 1,
        "totalResults": 1,
      }
    `,
    );
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
      ],
    });

    expect(response).toMatchInlineSnapshot(
      { data: { id: expect.any(String), meta: { location: expect.any(String) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
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
