import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/secrets/scim': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['secret'],
      operationId: 'getAppScimSecret',
      description: 'Get app SCIM secret configuration',
      security: [{ studio: [] }],
      responses: {
        200: {
          description: 'The app SCIM configuration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ScimSecret' },
            },
          },
        },
      },
    },
    patch: {
      tags: ['secret'],
      operationId: 'updateAppScimSecret',
      description: 'Update app SCIM secret configuration',
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ScimSecret' },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
      responses: {
        200: {
          description: 'The app SCIM configuration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ScimSecret' },
            },
          },
        },
      },
    },
  },
};
