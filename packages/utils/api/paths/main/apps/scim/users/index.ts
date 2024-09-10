import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/apps/{appId}/scim/Users': {
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
  },
  '/api/main/apps/{appId}/scim/Users/{userId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'userId',
        in: 'path',
        description: 'The ID of the member to perform the operation on',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimUser',
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
    delete: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'deleteAppScimUser',
      responses: {
        204: {
          description: 'SCIM user',
        },
      },
    },
    put: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'updateAppScimUser',
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
        200: {
          description: 'SCIM user',
        },
      },
    },
    patch: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'patchAppScimUser',
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
        200: {
          description: 'SCIM user',
        },
      },
    },
  },
};
