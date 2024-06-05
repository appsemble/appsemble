import { createServer, createTestUser, models, setArgv, useTestDatabase } from '@appsemble/server';
import { TeamRole } from '@appsemble/utils';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { initAxios } from './initAxios.js';
import {
  createTeam,
  deleteMember,
  deleteTeam,
  inviteMember,
  resolveAnnotations,
  updateMember,
  updateTeam,
} from './team.js';
import { authorizeCLI } from './testUtils.js';

const { App, AppMember, BlockVersion, Organization, OrganizationMember, Team, TeamMember } = models;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

useTestDatabase(import.meta);

beforeAll(() => {
  vi.useFakeTimers();
  setArgv(argv);
});

beforeEach(async () => {
  vi.clearAllTimers();
  vi.setSystemTime(0);
  const server = await createServer();
  testApp = await setTestApp(server);
  initAxios({ remote: testApp.defaults.baseURL });
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });

  await Organization.create({ id: 'appsemble', name: 'Appsemble' });

  await BlockVersion.create({
    name: 'test',
    OrganizationId: 'appsemble',
    version: '0.0.0',
    parameters: {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
        },
      },
    },
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe('createTeam', () => {
  it('should create a new team', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const clientCredentials = await authorizeCLI('teams:write', testApp);
    await createTeam({
      appId: app.id,
      name: 'test',
      remote: testApp.defaults.baseURL,
      clientCredentials,
    });

    const team = await Team.findOne();
    expect(team).toMatchInlineSnapshot(`
      {
        "AppId": 1,
        "annotations": null,
        "created": 1970-01-01T00:00:00.000Z,
        "id": 1,
        "name": "test",
        "updated": 1970-01-01T00:00:00.000Z,
      }
    `);
  });

  it('should throw if app does not exist', async () => {
    const clientCredentials = await authorizeCLI('teams:write', testApp);
    await expect(() =>
      createTeam({
        appId: 1,
        name: 'test',
        remote: testApp.defaults.baseURL,
        clientCredentials,
      }),
    ).rejects.toThrow('Request failed with status code 404');
  });
});

describe('deleteTeam', () => {
  it('should delete a team', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });

    const clientCredentials = await authorizeCLI('teams:write', testApp);
    await deleteTeam({
      appId: app.id,
      id: team.id,
      remote: testApp.defaults.baseURL,
      clientCredentials,
    });
    expect(team).toMatchInlineSnapshot(`
      {
        "AppId": 1,
        "annotations": null,
        "created": 1970-01-01T00:00:00.000Z,
        "id": 1,
        "name": "test",
        "updated": 1970-01-01T00:00:00.000Z,
      }
    `);
    const foundTeam = await Team.findOne();
    expect(foundTeam).toBeNull();
  });

  it('should throw an error if the team does not exist', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const clientCredentials = await authorizeCLI('teams:write', testApp);
    await expect(() =>
      deleteTeam({ appId: app.id, id: 1, remote: testApp.defaults.baseURL, clientCredentials }),
    ).rejects.toThrow('Request failed with status code 404');
  });
});

describe('updateTeam', () => {
  it('should update a team', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await authorizeCLI('teams:write', testApp);
    await updateTeam({
      appId: app.id,
      id: team.id,
      remote: testApp.defaults.baseURL,
      name: 'test2',
    });
    await team.reload();
    expect(team).toMatchInlineSnapshot(`
      {
        "AppId": 1,
        "annotations": null,
        "created": 1970-01-01T00:00:00.000Z,
        "id": 1,
        "name": "test2",
        "updated": 1970-01-01T00:00:00.000Z,
      }
    `);
  });

  it('should throw an error if the team does not exist', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await team.destroy();
    const clientCredentials = await authorizeCLI('teams:write', testApp);
    await expect(() =>
      updateTeam({
        appId: app.id,
        id: team.id,
        remote: testApp.defaults.baseURL,
        name: 'test2',
        clientCredentials,
      }),
    ).rejects.toThrow('Request failed with status code 404');
  });

  it('should throw an error if the user is not authenticated', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await expect(() =>
      updateTeam({
        appId: app.id,
        id: team.id,
        remote: testApp.defaults.baseURL,
        name: 'test2',
      }),
    ).rejects.toThrow('Request failed with status code 401');
  });
});

describe('inviteMember', () => {
  it('should invite a member to a team', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Manager',
      name: user.name,
    });
    await authorizeCLI('teams:write', testApp);
    await inviteMember({
      appId: app.id,
      id: team.id,
      remote: testApp.defaults.baseURL,
      user: user.id,
    });
    const member = await TeamMember.findOne();
    expect(member.dataValues).toMatchInlineSnapshot(
      {
        AppMemberId: expect.any(String),
      },
      `
      {
        "AppMemberId": Any<String>,
        "TeamId": 1,
        "created": 1970-01-01T00:00:00.000Z,
        "role": "member",
        "updated": 1970-01-01T00:00:00.000Z,
      }
    `,
    );
  });

  it('should throw an error if the user is not AppMember', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });

    await authorizeCLI('teams:write', testApp);
    await expect(() =>
      inviteMember({ appId: app.id, id: team.id, remote: testApp.defaults.baseURL, user: user.id }),
    ).rejects.toThrow('Request failed with status code 404');
  });

  it('should throw an error if the team does not exist', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await team.destroy();

    await authorizeCLI('teams:write', testApp);
    await expect(() =>
      inviteMember({ appId: app.id, id: team.id, remote: testApp.defaults.baseURL, user: user.id }),
    ).rejects.toThrow('Request failed with status code 404');
  });
});

describe('updateMember', () => {
  it('should update role of a team member', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Manager',
      name: user.name,
    });
    const teamMember = await TeamMember.create({
      TeamId: team.id,
      AppMemberId: member.id,
    });
    await authorizeCLI('teams:write', testApp);
    await updateMember({
      appId: app.id,
      remote: testApp.defaults.baseURL,
      user: user.id,
      role: TeamRole.Manager,
      id: team.id,
    });
    expect(teamMember.role).toBe('member');
    await teamMember.reload();
    expect(teamMember.role).toBe('manager');
  });

  it('should throw an error if the user is not a TeamMember', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Manager',
      name: user.name,
    });

    await authorizeCLI('teams:write', testApp);
    await expect(() =>
      updateMember({
        appId: app.id,
        remote: testApp.defaults.baseURL,
        user: user.id,
        role: TeamRole.Manager,
        id: team.id,
      }),
    ).rejects.toThrow('Request failed with status code 400');
  });
});

describe('deleteMember', () => {
  it('should delete a team member', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    const member = await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Manager',
      name: user.name,
    });
    await TeamMember.create({
      TeamId: team.id,
      AppMemberId: member.id,
    });
    await authorizeCLI('teams:write', testApp);

    await deleteMember({
      id: team.id,
      appId: app.id,
      user: user.id,
      remote: testApp.defaults.baseURL,
    });
    const foundTeamMember = await TeamMember.findOne();
    expect(foundTeamMember).toBeNull();
  });

  it('should throw an error if the TeamMember does not exist', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        security: {
          teams: {
            join: 'anyone',
            invite: [],
          },
          default: {
            role: 'Reader',
            policy: 'everyone',
          },
          roles: {
            Reader: {},
          },
        },
      },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const team = await Team.create({
      AppId: app.id,
      name: 'test',
    });
    await AppMember.create({
      email: user.primaryEmail,
      AppId: app.id,
      UserId: user.id,
      role: 'Manager',
      name: user.name,
    });

    await authorizeCLI('teams:write', testApp);
    await expect(() =>
      deleteMember({ appId: app.id, remote: testApp.defaults.baseURL, user: user.id, id: team.id }),
    ).rejects.toThrow('Request failed with status code 400');
  });
});

describe('resolveAnnotations', () => {
  it('should resolve team annotations', () => {
    const unresolvedAnnotations: string[] = ['foo=bar', 'hello=world'];
    const annotations = resolveAnnotations(unresolvedAnnotations);
    expect(annotations).toMatchObject({
      foo: 'bar',
      hello: 'world',
    });
  });

  it('should throw an error if annotations are not in right format', () => {
    const unresolvedAnnotations = ['foo:bar', 'hello.world'];
    expect(() => resolveAnnotations(unresolvedAnnotations)).toThrow(
      'One of the annotations did not follow the pattern of key=value',
    );
  });
});
