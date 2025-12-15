import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { resolveFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { initAxios } from './initAxios.js';
import { publishResource, updateResource } from './resource.js';
import { authorizeCLI } from './testUtils.js';

const { App, Organization, OrganizationMember, getAppDB } = models;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

describe('resource', () => {
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
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('publishResource', () => {
    it('should publish resources from a file', async () => {
      const resourceDefinition = {
        roles: ['$public'],
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
      };
      const app = await App.create({
        path: 'test-app',
        definition: {
          resources: { test: resourceDefinition },
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await authorizeCLI('resources:write', testApp);
      await publishResource({
        appId: app.id,
        definition: resourceDefinition as ResourceDefinition,
        path: resolveFixture('resources/test.json'),
        remote: testApp.defaults.baseURL!,
        type: 'test',
        seed: false,
      });
      const { Resource } = await getAppDB(app.id);
      const resources = await Resource.findAll();
      expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(`
        [
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "email": "test@example.com",
            "id": 1,
            "name": "John Doe",
          },
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "email": "test2@example.com",
            "id": 2,
            "name": "Jane Doe",
          },
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "id": 3,
            "name": "test name",
          },
        ]
      `);
    });
  });

  it('should throw if there is an error', async () => {
    const resourceDefinition = {
      roles: ['$public'],
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
        },
      },
    };
    const app = await App.create({
      path: 'test-app',
      definition: {
        resources: { test: resourceDefinition },
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      visibility: 'public',
      OrganizationId: organization.id,
    });
    await authorizeCLI('resources:write', testApp);
    await app.destroy();
    await expect(() =>
      publishResource({
        appId: app.id,
        definition: resourceDefinition as ResourceDefinition,
        path: resolveFixture('resources/test.json'),
        remote: testApp.defaults.baseURL!,
        type: 'test',
        seed: false,
      }),
    ).rejects.toThrowError('Request failed with status code 404');
  });

  describe('updateResource', () => {
    it('should update existing resources', async () => {
      const resourceDefinition = {
        roles: ['$public'],
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
      };
      const app = await App.create({
        path: 'test-app',
        definition: {
          resources: { test: resourceDefinition },
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      const { Resource } = await getAppDB(app.id);
      await Resource.bulkCreate([
        {
          id: 1,
          type: 'test',
          data: {
            name: 'Hello World',
          },
        },
        {
          id: 2,
          type: 'test',
          data: {
            name: 'World Hello',
            email: 'hello@example.com',
          },
        },
        {
          id: 3,
          type: 'test',
          data: {
            name: 'Random name',
            email: 'removed@example.com',
          },
        },
      ]);
      await authorizeCLI('resources:write', testApp);

      await updateResource({
        appId: app.id,
        resourceName: 'test',
        remote: testApp.defaults.baseURL!,
        path: resolveFixture('resources/test-update.json'),
      });

      const resources = await Resource.findAll();
      expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(`
        [
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "email": "test@example.com",
            "id": 1,
            "name": "John Doe",
          },
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "email": "test2@example.com",
            "id": 2,
            "name": "Jane Doe",
          },
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "id": 3,
            "name": "test name",
          },
        ]
      `);
    });

    it('should throw if the resource to be updated does not exist', async () => {
      const resourceDefinition = {
        roles: ['$public'],
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
      };
      const app = await App.create({
        path: 'test-app',
        definition: {
          resources: { test: resourceDefinition },
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      const { Resource } = await getAppDB(app.id);
      await Resource.bulkCreate([
        {
          id: 1,
          type: 'test',
          data: {
            name: 'Hello World',
          },
        },
        {
          id: 2,
          type: 'test',
          data: {
            name: 'World Hello',
            email: 'hello@example.com',
          },
        },
      ]);
      await authorizeCLI('resources:write', testApp);

      await expect(() =>
        updateResource({
          appId: app.id,
          resourceName: 'test',
          remote: testApp.defaults.baseURL!,
          path: resolveFixture('resources/test-update.json'),
        }),
      ).rejects.toThrowError('Request failed with status code 404');
    });

    it('should not update if there are no IDs in resource file', async () => {
      const resourceDefinition = {
        roles: ['$public'],
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
      };
      const app = await App.create({
        path: 'test-app',
        definition: {
          resources: { test: resourceDefinition },
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      const { Resource } = await getAppDB(app.id);
      await Resource.bulkCreate([
        {
          id: 1,
          type: 'test',
          data: {
            name: 'Hello World',
          },
        },
        {
          id: 2,
          type: 'test',
          data: {
            name: 'World Hello',
            email: 'hello@example.com',
          },
        },
      ]);
      await authorizeCLI('resources:write', testApp);
      const resources = await Resource.findAll();
      expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(`
        [
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "id": 1,
            "name": "Hello World",
          },
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "email": "hello@example.com",
            "id": 2,
            "name": "World Hello",
          },
        ]
      `);

      await updateResource({
        appId: app.id,
        resourceName: 'test',
        remote: testApp.defaults.baseURL!,
        path: resolveFixture('resources/test.json'),
      });
      expect(resources.map((r) => r.toJSON())).toMatchInlineSnapshot(`
        [
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "id": 1,
            "name": "Hello World",
          },
          {
            "$created": "1970-01-01T00:00:00.000Z",
            "$updated": "1970-01-01T00:00:00.000Z",
            "email": "hello@example.com",
            "id": 2,
            "name": "World Hello",
          },
        ]
      `);
    });
  });
});
