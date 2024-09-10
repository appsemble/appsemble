import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'service'],
    operationId: 'createAppServiceSecret',
    requestBody: {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AppServiceSecret' },
        },
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      201: {
        description: 'The created app service secret.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AppServiceSecret' },
          },
        },
      },
    },
  },
  get: {
    tags: ['main', 'app', 'secret', 'service'],
    operationId: 'getAppServiceSecrets',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The list of app service secrets.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/AppServiceSecret' },
            },
          },
        },
      },
    },
  },
  delete: {
    tags: ['main', 'app', 'secret', 'service'],
    operationId: 'deleteAppServiceSecrets',
    security: [{ studio: [] }, { cli: ['apps:write'] }],
    responses: {
      204: {
        description: 'The deleted app service secrets.',
      },
    },
  },
};
