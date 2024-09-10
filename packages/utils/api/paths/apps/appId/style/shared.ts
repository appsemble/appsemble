import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app'],
    description: 'Get the shared style for this app.',
    operationId: 'getAppSharedStyle',
    responses: {
      200: {
        description: 'The shared stylesheet associated with this app.',
        content: {
          'text/css': {},
        },
      },
    },
  },
};
