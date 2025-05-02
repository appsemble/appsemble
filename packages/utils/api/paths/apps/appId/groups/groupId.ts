import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    {
      name: 'groupId',
      in: 'path',
      description: 'The ID of the group',
      required: true,
      schema: { type: 'number', readOnly: true },
    },
  ],
  get: {
    tags: ['common', 'group'],
    description: 'Fetch an existing group.',
    operationId: 'getGroup',
    responses: {
      200: {
        description: 'The requested group',
        content: {
          'application/json': {
            schema: {
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
    security: [{ studio: [] }],
  },
  patch: {
    tags: ['common', 'group'],
    description: 'Update an existing group.',
    operationId: 'patchGroup',
    requestBody: {
      description: 'The group to update.',
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
      200: {
        description: 'The updated group',
        content: {
          'application/json': {
            schema: {
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
    security: [{ studio: [] }, { cli: ['groups:write'] }],
  },
  delete: {
    tags: ['common', 'group'],
    description: 'Delete an existing group.',
    operationId: 'deleteGroup',
    responses: {
      204: { description: 'The group has successfully been deleted.' },
    },
    security: [{ studio: [] }, { cli: ['groups:write'] }],
  },
};
