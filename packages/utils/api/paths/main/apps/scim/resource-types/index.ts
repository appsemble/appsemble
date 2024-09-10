import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/apps/{appId}/scim/ResourceTypes': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimResourceTypes',
      responses: {
        200: {
          description: 'SCIM user',
          content: {
            'application/scim+json': {
              schema: {
                // XXX
                // $ref: '#/components/schemas/ScimUser',
              },
            },
          },
        },
      },
    },
  },
  '/api/main/apps/{appId}/scim/ResourceTypes/{resourceTypeId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { name: 'resourceTypeId', in: 'path', schema: { type: 'string' } },
    ],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimResourceType',
      responses: {
        200: {
          description: 'SCIM user',
          content: {
            'application/scim+json': {
              schema: {
                // XXX
                // $ref: '#/components/schemas/ScimUser',
              },
            },
          },
        },
      },
    },
  },
};
