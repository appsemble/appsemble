import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app'],
    description: 'Get the core style for this app.',
    operationId: 'getAppCoreStyle',
    responses: {
      200: {
        description: 'The core stylesheet associated with this app.',
        content: {
          'text/css': {},
        },
      },
    },
  },
};
