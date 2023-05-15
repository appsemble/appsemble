import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/scim/Schemas': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMSchemas',
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
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMSchema',
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
  '/api/apps/{appId}/scim/ResourceTypes': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMResourceTypes',
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
  '/api/apps/{appId}/scim/ResourceTypes/{resourceTypeId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { name: 'resourceTypeId', in: 'path', schema: { type: 'string' } },
    ],
    get: {
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMResourceType',
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
  '/api/apps/{appId}/scim/ServiceProviderConfig': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMServiceProviderConfig',
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
  '/api/apps/{appId}/scim/Users': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    post: {
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'createSCIMUser',
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
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMUsers',
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
  '/api/apps/{appId}/scim/Users/{userId}': {
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
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'getSCIMUser',
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
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'deleteSCIMUser',
      responses: {
        204: {
          description: 'SCIM user',
        },
      },
    },
    put: {
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'updateSCIMUser',
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
      tags: ['scim'],
      security: [{ scim: [] }],
      operationId: 'patchSCIMUser',
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
