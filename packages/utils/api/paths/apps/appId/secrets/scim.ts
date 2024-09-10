import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app', 'secret', 'scim'],
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
    tags: ['main', 'app', 'secret', 'scim'],
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
};
