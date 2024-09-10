import { App } from '../../models/index.js';

export const exampleApp = (
  orgId: string,
  path = 'test-app',
  { template }: { template?: boolean } = {},
): Promise<App> =>
  App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      resources: {
        testResource: {
          views: {
            testView: {
              roles: ['Reader'],
              remap: {
                'object.from': {
                  name: {
                    'string.format': {
                      template: '{id}-{foo}',
                      values: { id: { prop: 'id' }, foo: { prop: 'foo' } },
                    },
                  },
                  randomValue: 'Some random value',
                },
              },
            },
            publicView: {
              roles: ['$public'],
              remap: { 'object.assign': { public: { static: true } } },
            },
            authorView: {
              roles: ['$author'],
              remap: { 'object.assign': { author: { static: true } } },
            },
          },
          schema: {
            type: 'object',
            required: ['foo'],
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
              fooz: { type: 'string' },
              baz: { type: 'string' },
              number: { type: 'number' },
              boolean: { type: 'boolean' },
              integer: { type: 'integer' },
              enum: { enum: ['A', 'B'] },
              date: { type: 'string', format: 'date' },
              object: { type: 'object' },
              array: { type: 'array' },
            },
          },
          roles: ['$public'],
          create: {
            hooks: {
              notification: {
                subscribe: 'all',
                data: {
                  title: 'This is the title of a created testResource',
                  content: [
                    {
                      'string.format': {
                        template: 'This is the created resource {id}’s body: {foo}',
                        values: { id: [{ prop: 'id' }], foo: [{ prop: 'foo' }] },
                      },
                    },
                  ],
                },
              },
            },
          },
          update: {
            hooks: {
              notification: {
                subscribe: 'both',
              },
            },
          },
        },
        testResourceB: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
          },
          roles: ['$public'],
          references: {
            testResourceId: {
              resource: 'testResource',
              delete: {
                triggers: [
                  {
                    type: 'delete',
                  },
                ],
              },
            },
          },
        },
        testResourceBB: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' }, testResourceBId: { type: 'number' } },
          },
          roles: ['$public'],
          references: {
            testResourceBId: {
              resource: 'testResourceB',
              delete: {
                triggers: [
                  {
                    type: 'delete',
                  },
                ],
              },
            },
          },
        },
        testResourceC: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
          },
          roles: ['$public'],
          references: {
            testResourceId: {
              resource: 'testResource',
              delete: {
                triggers: [
                  {
                    type: 'delete',
                    cascade: 'update',
                  },
                ],
              },
            },
          },
        },
        testResourceD: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
          },
          roles: ['$public'],
          references: {
            testResourceId: {
              resource: 'testResource',
              delete: {
                triggers: [
                  {
                    type: 'delete',
                    cascade: 'delete',
                  },
                ],
              },
            },
          },
        },
        testResourceNone: {
          schema: {
            type: 'object',
            required: ['bar'],
            properties: { bar: { type: 'string' } },
          },
          roles: ['$none'],
        },
        testResourceAuthorOnly: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          create: { roles: ['$author'] },
          count: { roles: ['$author'] },
          delete: { roles: ['$author'] },
          get: { roles: ['$author'] },
          query: { roles: ['$author'] },
          update: { roles: ['$author'] },
        },
        secured: {
          schema: { type: 'object' },
          create: {
            roles: ['Admin'],
          },
          query: {
            roles: ['Reader'],
          },
        },
        testResourceGroup: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          get: { roles: ['$author', '$group:member'] },
          query: { roles: ['$group:member'] },
          count: { roles: ['$group:member'] },
          update: { roles: ['$group:member'] },
          create: { roles: ['$group:member'] },
          delete: { roles: ['$group:member'] },
        },
        testResourceGroupManager: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          query: { roles: ['$author', '$group:manager'] },
          update: { roles: ['$group:manager'] },
          create: { roles: ['$group:manager'] },
          delete: { roles: ['$group:manager'] },
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
        testPrivateResource: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
          roles: [],
          count: {
            roles: ['$public'],
          },
        },
        testAssets: {
          schema: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
              file2: { type: 'string', format: 'binary' },
              string: { type: 'string' },
            },
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
      security: {
        default: {
          role: 'Reader',
          policy: 'invite',
        },
        roles: {
          Visitor: {},
          Reader: {},
          Admin: {
            inherits: ['Reader'],
          },
        },
      },
    },
    path,
    template,
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: orgId,
  });
