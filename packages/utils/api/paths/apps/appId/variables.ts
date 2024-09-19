import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['common', 'app', 'variable'],
    operationId: 'getAppVariables',
    responses: {
      200: {
        description: 'The list of app variables.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/AppVariable' },
            },
          },
        },
      },
    },
  },
  post: {
    tags: ['main', 'app', 'variable'],
    operationId: 'createAppVariable',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppVariable' },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      201: {
        description: 'The created app variable.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppVariable' },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app', 'variable'],
    operationId: 'deleteAppVariables',
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      204: {
        description: 'The deleted app variables.',
      },
    },
  },
};
