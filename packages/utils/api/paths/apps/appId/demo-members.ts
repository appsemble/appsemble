import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/roles' },
    { $ref: '#/components/parameters/$filter' },
  ],
  get: {
    tags: ['common', 'app', 'demo-member'],
    description: 'Fetch all demo members of an app.',
    operationId: 'queryAppDemoMembers',
    responses: {
      200: {
        description: 'The list of app demo members.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AppMemberInfo',
              },
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['main', 'seed-app-members', 'demo-member', 'app'],
    description: 'Seed demo app members from the cli.',
    operationId: 'seedDemoAppMembers',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'array',
            additionalProperties: false,
            items: {
              type: 'object',
              required: ['name', 'role'],
              properties: {
                name: {
                  type: 'string',
                },
                role: {
                  type: 'string',
                },
                properties: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'The member’s custom properties.',
                },
                timezone: {
                  enum: Intl.supportedValuesOf('timeZone'),
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The list of created app members',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AppMemberInfo',
              },
            },
          },
        },
      },
    },
    security: [{ cli: ['apps:write'] }],
  },
  delete: {
    description: 'Delete all seed app members for an app',
    tags: ['main', 'app', 'demo-member', 'delete'],
    operationId: 'deleteSeedAppMembers',
    responses: {
      204: {
        description: 'The seed app members have been deleted successfully',
      },
    },
    security: [{ cli: ['apps:write'] }],
  },
};
