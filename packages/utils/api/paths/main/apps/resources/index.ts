import { type OpenAPIV3 } from 'openapi-types';

import { paths as versionsPaths } from './versions/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...versionsPaths,
  '/api/main/apps/{appId}/resources': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    delete: {
      tags: ['main', 'app', 'resource'],
      description: 'Delete all app seed resources.',
      operationId: 'deleteAppSeedResources',
      responses: {
        204: {
          description: 'The app resources have been deleted successfully.',
        },
      },
      security: [{ cli: ['resources:write'] }, {}],
    },
  },
  '/api/main/apps/{appId}/resources/{resourceType}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/resourceType' },
    ],
    post: {
      tags: ['main', 'app', 'resource'],
      description: 'Create a new resource for this app.',
      operationId: 'createAppSeedResource',
      requestBody: {
        required: true,
        description: 'The resource to create',
        content: {
          'application/json': {
            schema: {
              anyOf: [
                { $ref: '#/components/schemas/Resource' },
                { type: 'array', items: { $ref: '#/components/schemas/Resource' } },
              ],
            },
          },
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['resource'],
              description: 'A `multipart/form-data` representation of a resource.',
              additionalProperties: false,
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Resource' },
                },
                assets: {
                  type: 'array',
                  description: 'A list of assets that should be linked to the resource.',
                  items: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
          'text/csv': {
            schema: {
              type: 'array',
              items: { type: 'object', additionalProperties: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The resource that was created.',
          $ref: '#/components/responses/resource',
        },
      },
      security: [{ studio: [] }, { cli: ['resources:write'] }, {}],
    },
  },
};
