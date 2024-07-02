import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/scim/Schemas': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimSchemas',
      responses: {
        200: {
          description: 'The SCIM Schema',
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
  '/api/apps/{appId}/scim/Schemas/{schemaId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { name: 'schemaId', in: 'path', schema: { type: 'string' } },
    ],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimSchema',
      responses: {
        200: {
          description: 'The SCIM Schema',
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
};
