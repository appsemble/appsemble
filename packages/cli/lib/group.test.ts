import {
  createServer,
  createTestAppMember,
  createTestUser,
  models,
  setArgv,
} from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createGroup,
  deleteGroup,
  deleteMember,
  inviteMember,
  resolveAnnotations,
  updateGroup,
  updateMember,
} from './group.js';
import { initAxios } from './initAxios.js';
import { authorizeCLI } from './testUtils.js';

const {
  App,
  AppMember,
  BlockVersion,
  Group,
  GroupInvite,
  GroupMember,
  Organization,
  OrganizationMember,
} = models;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

describe('group', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    setArgv(argv);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const server = await createServer();
    testApp = await setTestApp(server);
    initAxios({ remote: testApp.defaults.baseURL! });
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
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

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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

      const clientCredentials = await authorizeCLI('groups:write', testApp);
      await createGroup({
        appId: app.id,
        name: 'test',
        remote: testApp.defaults.baseURL!,
        clientCredentials,
      });

      const group = await Group.findOne();
      expect(group).toMatchInlineSnapshot(`
        {
          "AppId": 1,
          "annotations": null,
          "created": 1970-01-01T00:00:00.000Z,
          "demo": false,
          "id": 1,
          "name": "test",
          "updated": 1970-01-01T00:00:00.000Z,
        }
      `);
    });

    it('should throw if app does not exist', async () => {
      const clientCredentials = await authorizeCLI('groups:write', testApp);
      await expect(() =>
        createGroup({
          appId: 1,
          name: 'test',
          remote: testApp.defaults.baseURL!,
          clientCredentials,
        }),
      ).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });

      const clientCredentials = await authorizeCLI('groups:write', testApp);
      await deleteGroup({
        appId: app.id,
        id: group.id,
        remote: testApp.defaults.baseURL!,
        clientCredentials,
      });
      expect(group).toMatchInlineSnapshot(`
        {
          "AppId": 1,
          "annotations": null,
          "created": 1970-01-01T00:00:00.000Z,
          "demo": false,
          "id": 1,
          "name": "test",
          "updated": 1970-01-01T00:00:00.000Z,
        }
      `);
      const foundGroup = await Group.findOne();
      expect(foundGroup).toBeNull();
    });

    it('should throw an error if the group does not exist', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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
      const clientCredentials = await authorizeCLI('groups:write', testApp);
      await expect(() =>
        deleteGroup({ appId: app.id, id: 1, remote: testApp.defaults.baseURL!, clientCredentials }),
      ).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('updateGroup', () => {
    it('should update a group', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      await authorizeCLI('groups:write', testApp);
      await updateGroup({
        appId: app.id,
        id: group.id,
        remote: testApp.defaults.baseURL!,
        name: 'test2',
      });
      await group.reload();
      expect(group).toMatchInlineSnapshot(`
        {
          "AppId": 1,
          "annotations": null,
          "created": 1970-01-01T00:00:00.000Z,
          "demo": false,
          "id": 1,
          "name": "test2",
          "updated": 1970-01-01T00:00:00.000Z,
        }
      `);
    });

    it('should throw an error if the group does not exist', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      await group.destroy();
      const clientCredentials = await authorizeCLI('groups:write', testApp);
      await expect(() =>
        updateGroup({
          appId: app.id,
          id: group.id,
          remote: testApp.defaults.baseURL!,
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
            groups: {
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
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      await expect(() =>
        updateGroup({
          appId: app.id,
          id: group.id,
          remote: testApp.defaults.baseURL!,
          name: 'test2',
        }),
      ).rejects.toThrow('Request failed with status code 401');
    });
  });

  describe('inviteMember', () => {
    it('should invite a member to a group', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
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
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Reader',
        name: user.name,
      });
      await authorizeCLI('groups:write', testApp);
      await inviteMember({
        appId: app.id,
        id: group.id,
        remote: testApp.defaults.baseURL!,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        user: user.primaryEmail,
        role: 'Reader',
      });
      const invite = (await GroupInvite.findOne())!;
      expect(invite.dataValues).toMatchInlineSnapshot(
        {
          key: expect.any(String),
        },
        `
      {
        "GroupId": 1,
        "created": 1970-01-01T00:00:00.000Z,
        "email": "test@example.com",
        "key": Any<String>,
        "role": "Reader",
        "updated": 1970-01-01T00:00:00.000Z,
      }
    `,
      );
    });

    it('should throw an error if the group does not exist', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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

      await authorizeCLI('groups:write', testApp);
      await expect(() =>
        inviteMember({
          appId: app.id,
          id: 10,
          remote: testApp.defaults.baseURL!,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          user: user.primaryEmail,
          role: 'Reader',
        }),
      ).rejects.toThrow('Request failed with status code 400');
    });
  });

  describe('updateMember', () => {
    it('should update role of a group member', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            default: {
              role: 'Reader',
              policy: 'everyone',
            },
            roles: {
              Reader: {},
              Updater: {
                inherits: ['Manager'],
              },
            },
          },
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      });
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      const member = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Updater',
        name: user.name,
      });
      const groupMember = await GroupMember.create({
        GroupId: group.id,
        AppMemberId: member.id,
        role: 'Reader',
      });
      await authorizeCLI('groups:write', testApp);
      await updateMember({
        appId: app.id,
        remote: testApp.defaults.baseURL!,
        user: groupMember.id,
        role: 'Updater',
        id: group.id,
      });
      expect(groupMember.role).toBe('Reader');
      await groupMember.reload();
      expect(groupMember.role).toBe('Updater');
    });

    it('should throw an error if the user is not a GroupMember', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
              join: 'anyone',
              invite: [],
            },
            default: {
              role: 'Reader',
              policy: 'everyone',
            },
            roles: {
              Reader: {},
              Updater: {
                inherits: ['Manager'],
              },
            },
          },
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      });
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Updater',
        name: user.name,
      });

      await authorizeCLI('groups:write', testApp);
      await expect(() =>
        updateMember({
          appId: app.id,
          remote: testApp.defaults.baseURL!,
          user: user.id,
          role: 'Updater',
          id: group.id,
        }),
      ).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('deleteMember', () => {
    it('should delete a group member', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
              join: 'anyone',
              invite: [],
            },
            default: {
              role: 'Reader',
              policy: 'everyone',
            },
            roles: {
              Reader: {},
              Updater: {
                inherits: ['Maintainer'],
              },
            },
          },
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      });
      const group = await Group.create({
        AppId: app.id,
        name: 'test',
      });
      const member = await AppMember.create({
        email: user.primaryEmail,
        AppId: app.id,
        UserId: user.id,
        role: 'Updater',
        name: user.name,
      });
      await authorizeCLI('groups:write', testApp);
      await createTestUser('test2@example.com');
      const member2 = await createTestAppMember(app.id, 'test2@example.com');
      await GroupMember.create({
        GroupId: group.id,
        AppMemberId: member.id,
        role: 'Updater',
      });
      const { id: groupMemberId } = await GroupMember.create({
        GroupId: group.id,
        AppMemberId: member2.id,
        role: 'Reader',
      });

      await deleteMember({
        id: group.id,
        appId: app.id,
        user: groupMemberId,
        remote: testApp.defaults.baseURL!,
      });
      const foundGroupMember = await GroupMember.findByPk(groupMemberId);
      expect(foundGroupMember).toBeNull();
    });

    it('should throw an error if the GroupMember does not exist', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          security: {
            groups: {
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
      const group = await Group.create({
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

      await authorizeCLI('groups:write', testApp);
      await expect(() =>
        deleteMember({
          appId: app.id,
          remote: testApp.defaults.baseURL!,
          user: user.id,
          id: group.id,
        }),
      ).rejects.toThrow('Request failed with status code 404');
    });
  });

  describe('resolveAnnotations', () => {
    it('should resolve group annotations', () => {
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
});
