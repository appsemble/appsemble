import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'scim'],
    security: [{ scim: [] }],
    operationId: 'createAppScimUser',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        'application/scim+json': {
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Integrated SCIM user schema',
        content: {
          'application/scim+json': {
            schema: {
              $ref: '#/components/schemas/ScimUser',
            },
          },
        },
      },
    },
  },
  get: {
    tags: ['main', 'app', 'scim'],
    security: [{ scim: [] }],
    operationId: 'getAppScimUsers',
    parameters: [
      { name: 'count', in: 'query', schema: { type: 'number' } },
      { name: 'startIndex', in: 'query', schema: { type: 'number' } },
    ],
    responses: {
      200: {
        description: 'SCIM user',
        content: {
          'application/scim+json': {
            schema: {
              $ref: '#/components/schemas/ScimUser',
            },
          },
        },
      },
    },
  },
};
