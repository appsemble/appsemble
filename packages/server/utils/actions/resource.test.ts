import { type ActionDefinition } from '@appsemble/lang-sdk';
import { uuid4Pattern } from '@appsemble/utils';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { create, get, patch, query, remove, update } from './resource.js';
import { App } from '../../models/App.js';
import { Organization } from '../../models/Organization.js';
import { Resource } from '../../models/Resource.js';
import { ResourceVersion } from '../../models/ResourceVersion.js';
import { options } from '../../options/options.js';
import { handleAction } from '../action.js';
import { argv, setArgv } from '../argv.js';
import { Mailer } from '../email/Mailer.js';

let mailer: Mailer;

const exampleApp = (orgId: string, action: ActionDefinition, path = 'test-app'): Promise<App> =>
  App.create({
    OrganizationId: orgId,
    path,
    vapidPrivateKey: '',
    vapidPublicKey: '',
    definition: {
      name: 'Test App',
      defaultPage: '',
      resources: {
        person: {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['firstName', 'lastName'],
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
            },
          },
          views: {
            fullName: {
              roles: ['$public'],
              remap: {
                'object.from': {
                  fullName: {
                    'string.format': {
                      template: '{firstName} {lastName}',
                      values: {
                        firstName: { prop: 'firstName' },
                        lastName: { prop: 'lastName' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        testResourceB: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              test: { type: 'string' },
            },
          },
        },
        testExpirableResource: {
          expires: '10m',
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: ['$public'],
        },
        testHistoryTrue: {
          roles: ['$public'],
          history: true,
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
        testHistoryDataTrue: {
          roles: ['$public'],
          history: { data: true },
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
        testHistoryDataFalse: {
          roles: ['$public'],
          history: { data: false },
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
      },
      pages: [],
      cron: {
        list: {
          schedule: '* * * * *',
          action,
        },
      },
    },
  } as Partial<App>);

describe('resource', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    setArgv({ host: 'https://example.com' });
    mailer = new Mailer(argv);
    await Organization.create({ id: 'testorg' });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('resource.query', () => {
    it('should query resources', async () => {
      const action: ActionDefinition = {
        type: 'resource.query',
        resource: 'person',
      };
      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { name: 'Spongebob' },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { name: 'Patrick' },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(query, {
        app,
        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          id: 1,
          name: 'Spongebob',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          id: 2,
          name: 'Patrick',
        },
      ]);
    });

    it('should support views', async () => {
      const action: ActionDefinition = {
        type: 'resource.query',
        resource: 'person',
        view: 'fullName',
      };
      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Spongebob', lastName: 'Squarepants' },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(query, {
        app,
        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual([
        { fullName: 'Spongebob Squarepants' },
        { fullName: 'Patrick Star' },
      ]);
    });
  });

  describe('resource.get', () => {
    it('should get a single resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.get',
        resource: 'person',
      };
      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { name: 'Spongebob' },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { name: 'Patrick' },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(get, {
        app,
        action,
        mailer,
        data: { id: 1 },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        name: 'Spongebob',
      });
    });

    it('should support views', async () => {
      const action: ActionDefinition = {
        type: 'resource.get',
        resource: 'person',
        view: 'fullName',
      };
      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Spongebob', lastName: 'Squarepants' },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(get, {
        app,
        action,
        mailer,
        data: { id: 1 },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({ fullName: 'Spongebob Squarepants' });
    });

    it('should not be able to get a resource when missing an id', async () => {
      const action: ActionDefinition = {
        type: 'resource.get',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(get, {
          app,
          action,
          mailer,
          data: {},
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Missing id');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });

    it('should not be able to get a non-existent resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.get',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(get, {
          app,
          action,
          mailer,
          data: { id: 72_183 },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });
  });

  describe('resource.create', () => {
    it('should create a new resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(create, {
        app,
        action,
        mailer,
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        firstName: 'Spongebob',
        lastName: 'Squarepants',
      });
    });

    it('should create ephemeral resources in demo apps', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await app.update({ demoMode: true });
      await app.reload();

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(create, {
        app,
        action,
        mailer,
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $ephemeral: true,
        id: 1,
        firstName: 'Spongebob',
        lastName: 'Squarepants',
      });
    });

    it('should create a new resource using the action body', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'person',
        body: {
          'object.from': {
            firstName: 'Spongebob',
            lastName: 'Squarepants',
          },
        },
      };

      const app = await exampleApp('testorg', action);

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(create, {
        app,
        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        firstName: 'Spongebob',
        lastName: 'Squarepants',
      });
    });

    it('should validate resources', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);
      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(create, {
          app,
          action,
          mailer,
          data: {
            firstName: 'Spongebob',
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource validation failed');
    });

    it('should check if app has the specified resource definition', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'testResourceC',
      };

      const app = await exampleApp('testorg', action);

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(create, {
          app,
          action,
          mailer,
          data: {},
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('App does not have resources called testResourceC');

      const remainingResources = await Resource.findAll();
      expect(remainingResources).toStrictEqual([]);
    });

    it('should calculate resource expiration', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(create, {
        app,

        action,
        mailer,
        data: {
          foo: 'bar',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:10:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        foo: 'bar',
      });
    });

    it('should set resource expiration', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(create, {
        app,

        action,
        mailer,
        data: {
          foo: 'bar',
          $expires: '1970-01-01T00:05:00.000Z',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:05:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        foo: 'bar',
      });
    });

    it('should not set resource expiration if given date has already passed', async () => {
      // 10 minutes
      vi.useRealTimers();
      vi.useFakeTimers();
      vi.advanceTimersByTime(600e3);

      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(create, {
          app,

          action,
          mailer,
          data: {
            foo: 'bar',
            $expires: '1970-01-01T00:05:00.000Z',
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource validation failed');
    });

    it('should accept an array of resources', async () => {
      const action: ActionDefinition = {
        type: 'resource.create',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(create, {
        app,

        action,
        mailer,
        data: [
          {
            firstName: 'Spongebob',
            lastName: 'Squarepants',
          },
          {
            firstName: 'Patrick',
            lastName: 'Star',
          },
        ],
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          id: 1,
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          id: 2,
          firstName: 'Patrick',
          lastName: 'Star',
        },
      ]);
    });
  });

  describe('resource.update', () => {
    it('should be able to update an existing resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Patrick',
          lastName: 'Star',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        firstName: 'Patrick',
        lastName: 'Star',
      });
    });

    it('should update resource using body', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
        body: {
          'object.from': {
            id: 1,
            firstName: 'Patrick',
            lastName: 'Star',
          },
        },
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        firstName: 'Patrick',
        lastName: 'Star',
      });
    });

    it('should not be able to update a resource when missing an id', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(update, {
          app,

          action,
          mailer,
          data: {},
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Missing id');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Patrick',
          id: 2,
          lastName: 'Star',
        },
      ]);
    });

    it('should not be able to update a non-existent resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(update, {
          app,

          action,
          mailer,
          data: {
            id: 8132,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Patrick',
          id: 2,
          lastName: 'Star',
        },
      ]);
    });

    it('should not be possible to update an existing resource through another resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'testResourceB',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(update, {
          app,

          action,
          mailer,
          data: {
            id: 1,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });

    it('should not be possible to update an existing resource through another app', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      const appB = await exampleApp('testorg', action, 'app-b');

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(update, {
          app: appB,

          action,
          mailer,
          data: {
            id: 1,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });

    it('should validate resources', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(update, {
          app,

          action,
          mailer,
          data: {
            id: 1,
            firstName: 'Spongebob',
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource validation failed');
    });

    it('should set clonable if specified in the request', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Squidward',
          lastName: 'Tentacles',
          $clonable: true,
        },
        options,
        context: {} as any,
      });

      await resource.reload();

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        firstName: 'Squidward',
        id: 1,
        lastName: 'Tentacles',
      });
      expect(resource.clonable).toBe(true);
    });

    it('should set expires', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'testExpirableResource',
        data: {
          foo: 'test',
          $expires: '1970-01-01T00:05:00.000Z',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          foo: 'updated',
          $expires: '1970-01-01T00:07:00.000Z',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:07:00.000Z',
        foo: 'updated',
        id: 1,
      });
    });

    it('should not set $expires if the date has already passed', async () => {
      // 10 minutes
      vi.useRealTimers();
      vi.useFakeTimers();
      vi.advanceTimersByTime(600e3);

      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'testExpirableResource',
        data: {
          foo: 'test',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(update, {
          app,

          action,
          mailer,
          data: {
            id: 1,
            foo: 'updated',
            $expires: '1970-01-01T00:07:00.000Z',
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource validation failed');
    });

    it('should clear the updater', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Squidward',
          lastName: 'Tentacles',
          $clonable: true,
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        firstName: 'Squidward',
        id: 1,
        lastName: 'Tentacles',
      });

      await resource.reload({ include: [{ association: 'Editor' }] });

      expect(resource.EditorId).toBeNull();
    });

    it('should keep an old resource version including data if history is true', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'testHistoryTrue',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'testHistoryTrue',
        data: {
          string: 'rev1',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          string: 'rev2',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        string: 'rev2',
      });

      await resource.reload();
      expect(resource.data).toStrictEqual({
        string: 'rev2',
      });
      const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
      expect(resourceVersion).toStrictEqual({
        ResourceId: resource.id,
        AppMemberId: null,
        created: new Date(),
        data: { string: 'rev1' },
        id: expect.stringMatching(uuid4Pattern),
      });
    });

    it('should keep an old resource version including data if history.data is true', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'testHistoryDataTrue',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'testHistoryDataTrue',
        data: {
          string: 'rev1',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          string: 'rev2',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        string: 'rev2',
      });

      await resource.reload();
      expect(resource.data).toStrictEqual({
        string: 'rev2',
      });
      const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
      expect(resourceVersion).toStrictEqual({
        ResourceId: resource.id,
        AppMemberId: null,
        created: new Date(),
        data: { string: 'rev1' },
        id: expect.stringMatching(uuid4Pattern),
      });
    });

    it('should keep an old resource version including data if history is false', async () => {
      const action: ActionDefinition = {
        type: 'resource.update',
        resource: 'testHistoryDataFalse',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'testHistoryDataFalse',
        data: {
          string: 'rev1',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(update, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          string: 'rev2',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        string: 'rev2',
      });

      await resource.reload();
      expect(resource.data).toStrictEqual({
        string: 'rev2',
      });
      const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
      expect(resourceVersion).toStrictEqual({
        ResourceId: resource.id,
        AppMemberId: null,
        created: new Date(),
        data: null,
        id: expect.stringMatching(uuid4Pattern),
      });
    });
  });

  describe('resource.patch', () => {
    it('should be able to patch an existing resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Squidward',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        firstName: 'Squidward',
        lastName: 'Squarepants',
      });
    });

    it('should patch resource using body', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
        body: {
          'object.from': {
            id: 1,
            firstName: 'Squidward',
          },
        },
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {},
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        firstName: 'Squidward',
        lastName: 'Squarepants',
      });
    });

    it('should not be able to patch a resource when missing an id', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(patch, {
          app,

          action,
          mailer,
          data: {},
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Missing id');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Patrick',
          id: 2,
          lastName: 'Star',
        },
      ]);
    });

    it('should not be able to patch a non-existent resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(patch, {
          app,

          action,
          mailer,
          data: {
            id: 8132,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Patrick',
          id: 2,
          lastName: 'Star',
        },
      ]);
    });

    it('should not be possible to patch an existing resource through another resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testResourceB',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(patch, {
          app,

          action,
          mailer,
          data: {
            id: 1,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });

    it('should not be possible to patch an existing resource through another app', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      const appB = await exampleApp('testorg', action, 'app-b');

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(patch, {
          app: appB,

          action,
          mailer,
          data: {
            id: 1,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });

    it('should validate resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testResourceC',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(patch, {
          app,

          action,
          mailer,
          data: {
            id: 1,
            firstName: 'Spongebob',
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('App does not have resources called testResourceC');
    });

    it('should not validate required properties', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Squidward',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        firstName: 'Squidward',
        id: 1,
        lastName: 'Squarepants',
      });
    });

    it('should set clonable if specified in the request', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Squidward',
          $clonable: true,
        },
        options,
        context: {} as any,
      });

      await resource.reload();

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        firstName: 'Squidward',
        id: 1,
        lastName: 'Squarepants',
      });
      expect(resource.clonable).toBe(true);
    });

    it('should set expires', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'testExpirableResource',
        data: {
          foo: 'test',
          $expires: '1970-01-01T00:05:00.000Z',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          foo: 'updated',
          $expires: '1970-01-01T00:07:00.000Z',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        $expires: '1970-01-01T00:07:00.000Z',
        foo: 'updated',
        id: 1,
      });
    });

    it('should not set $expires if the date has already passed', async () => {
      // 10 minutes
      vi.useRealTimers();
      vi.useFakeTimers();
      vi.advanceTimersByTime(600e3);

      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testExpirableResource',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'testExpirableResource',
        data: {
          foo: 'test',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(patch, {
          app,

          action,
          mailer,
          data: {
            id: 1,
            foo: 'updated',
            $expires: '1970-01-01T00:07:00.000Z',
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource validation failed');
    });

    it('should clear the updater', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          firstName: 'Squidward',
          $clonable: true,
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        firstName: 'Squidward',
        id: 1,
        lastName: 'Squarepants',
      });

      await resource.reload({ include: [{ association: 'Editor' }] });

      expect(resource.EditorId).toBeNull();
    });

    it('should keep an old resource version including data if history is true', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testHistoryTrue',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'testHistoryTrue',
        data: {
          string: 'rev1',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          string: 'rev2',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        string: 'rev2',
      });

      await resource.reload();
      expect(resource.data).toStrictEqual({
        string: 'rev2',
      });
      const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
      expect(resourceVersion).toStrictEqual({
        ResourceId: resource.id,
        AppMemberId: null,
        created: new Date(),
        data: { string: 'rev1' },
        id: expect.stringMatching(uuid4Pattern),
      });
    });

    it('should keep an old resource version including data if history.data is true', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testHistoryDataTrue',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'testHistoryDataTrue',
        data: {
          string: 'rev1',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          string: 'rev2',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        string: 'rev2',
      });

      await resource.reload();
      expect(resource.data).toStrictEqual({
        string: 'rev2',
      });
      const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
      expect(resourceVersion).toStrictEqual({
        ResourceId: resource.id,
        AppMemberId: null,
        created: new Date(),
        data: { string: 'rev1' },
        id: expect.stringMatching(uuid4Pattern),
      });
    });

    it('should keep an old resource version including data if history is false', async () => {
      const action: ActionDefinition = {
        type: 'resource.patch',
        resource: 'testHistoryDataFalse',
      };

      const app = await exampleApp('testorg', action);

      const resource = await Resource.create({
        AppId: app.id,
        type: 'testHistoryDataFalse',
        data: {
          string: 'rev1',
        },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const result = await handleAction(patch, {
        app,

        action,
        mailer,
        data: {
          id: 1,
          string: 'rev2',
        },
        options,
        context: {} as any,
      });

      expect(result).toStrictEqual({
        $created: '1970-01-01T00:00:00.000Z',
        $updated: '1970-01-01T00:00:00.000Z',
        id: 1,
        string: 'rev2',
      });

      await resource.reload();
      expect(resource.data).toStrictEqual({
        string: 'rev2',
      });
      const [resourceVersion] = await ResourceVersion.findAll({ raw: true });
      expect(resourceVersion).toStrictEqual({
        ResourceId: resource.id,
        AppMemberId: null,
        created: new Date(),
        data: null,
        id: expect.stringMatching(uuid4Pattern),
      });
    });
  });

  describe('resource.delete', () => {
    it('should delete a resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.delete',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const deletedResource = await handleAction(remove, {
        app,

        action,
        mailer,
        data: {
          id: 1,
        },
        options,
        context: {} as any,
      });

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(deletedResource).toBe('');

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          id: 2,
          firstName: 'Patrick',
          lastName: 'Star',
        },
      ]);
    });

    it('should use the passed data to delete resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.delete',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      const deletedResource = await handleAction(remove, {
        app,

        action,
        mailer,
        data: {
          id: 1,
        },
        options,
        context: {} as any,
      });

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(deletedResource).toBe('');

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          id: 2,
          firstName: 'Patrick',
          lastName: 'Star',
        },
      ]);
    });

    it('should not be able to delete a resource when missing an id', async () => {
      const action: ActionDefinition = {
        type: 'resource.delete',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(remove, {
          app,

          action,
          mailer,
          data: {},
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Missing id');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Patrick',
          id: 2,
          lastName: 'Star',
        },
      ]);
    });

    it('should not be able to delete a non-existent resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.delete',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });
      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: { firstName: 'Patrick', lastName: 'Star' },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(remove, {
          app,

          action,
          mailer,
          data: {
            id: 8132,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Patrick',
          id: 2,
          lastName: 'Star',
        },
      ]);
    });

    it('should not be possible to delete an existing resource through another resource', async () => {
      const action: ActionDefinition = {
        type: 'resource.delete',
        resource: 'testResourceB',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(remove, {
          app,

          action,
          mailer,
          data: {
            id: 1,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });

    it('should not be possible to delete an existing resource through another app', async () => {
      const action: ActionDefinition = {
        type: 'resource.delete',
        resource: 'person',
      };

      const app = await exampleApp('testorg', action);

      await Resource.create({
        AppId: app.id,
        type: 'person',
        data: {
          firstName: 'Spongebob',
          lastName: 'Squarepants',
        },
      });

      const appB = await exampleApp('testorg', action, 'app-b');

      await expect(() =>
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        handleAction(remove, {
          app: appB,

          action,
          mailer,
          data: {
            id: 1,
          },
          options,
          context: {} as any,
        }),
      ).rejects.toThrow('Resource not found');

      const remainingResources = await Resource.findAll();
      const mappedResources = remainingResources.map((resource) => resource.toJSON());

      expect(mappedResources).toStrictEqual([
        {
          $created: '1970-01-01T00:00:00.000Z',
          $updated: '1970-01-01T00:00:00.000Z',
          firstName: 'Spongebob',
          id: 1,
          lastName: 'Squarepants',
        },
      ]);
    });
  });
});
