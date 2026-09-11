import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  put: {
    tags: ['main', 'app', 'resource'],
    description:
      'Atomically replace all seed resources and demo resource copies. Indexed references use $resourceType with a zero-based offset into that resource type.',
    operationId: 'replaceAppSeedResources',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The published resource IDs, grouped by resource type.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: { type: 'array', items: { type: 'integer' } },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['resources:write'] }],
  },
  delete: {
    tags: ['main', 'app', 'resource'],
    description: 'Delete all app seed resources.',
    operationId: 'deleteAppSeedResources',
    responses: {
      204: {
        description: 'The app resources have been deleted successfully.',
      },
    },
    security: [{ studio: [] }, { cli: ['resources:write'] }],
  },
};
