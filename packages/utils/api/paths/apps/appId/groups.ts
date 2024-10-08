import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'group'],
    description: 'Get a list of app groups.',
    operationId: 'getAppGroups',
    responses: {
      200: {
        description: 'The list of all groups.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                description: 'An app group',
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['groups:read'] }, {}],
  },
  post: {
    tags: ['common', 'app', 'group'],
    description: 'Create a new group.',
    operationId: 'createAppGroup',
    parameters: [{ $ref: '#/components/parameters/selectedGroupId' }],
    requestBody: {
      description: 'The group to create.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
              },
              annotations: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'The created group',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                role: {
                  type: 'string',
                  description: 'The role of the user who created the group',
                  enum: ['member'],
                },
              },
            },
          },
        },
      },
    },
    security: [{ app: ['groups:write'] }, { studio: [] }, { cli: ['groups:write'] }],
  },
};
