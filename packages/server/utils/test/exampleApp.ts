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
              remap: { 'object.assign': { public: { static: true } } },
            },
            authorView: {
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
          views: {
            testView: {
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
          },
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
        },
        testResourceAuthorOnly: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
        },
        secured: {
          schema: { type: 'object' },
        },
        testResourceGroup: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
        },
        testResourceGroupManager: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
        },
        testExpirableResource: {
          expires: '10m',
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
          },
        },
        testPrivateResource: {
          schema: {
            type: 'object',
            required: ['foo'],
            properties: { foo: { type: 'string' } },
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
        },
        testHistoryTrue: {
          history: true,
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
        testHistoryDataTrue: {
          history: { data: true },
          schema: {
            type: 'object',
            properties: {
              string: { type: 'string' },
            },
          },
        },
        testHistoryDataFalse: {
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
        guest: {
          permissions: [
            '$resource:testResource:own:get',
            '$resource:testResource:query',
            '$resource:testExpirableResource:query',
            '$resource:testResourceNone:query',
          ],
          inherits: [],
        },
        default: {
          role: 'Reader',
        },
        roles: {
          Visitor: {},
          Reader: {
            permissions: ['$resource:testResourceAuthorOnly:own:query'],
          },
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
