import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/snapshots': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app', 'snapshot'],
      description: 'Get a list of snapshots made of the app.',
      operationId: 'getAppSnapshots',
      responses: {
        200: {
          description: 'The available snapshots',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', description: 'The ID of the snapshot.' },
                    $created: {
                      type: 'string',
                      format: 'date-time',
                      description: 'The creation date of the snapshot.',
                    },
                    $author: {
                      type: 'object',
                      properties: {
                        id: { $ref: '#/components/schemas/User/properties/id' },
                        name: { $ref: '#/components/schemas/User/properties/name' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
  '/api/apps/{appId}/snapshots/{snapshotId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'snapshotId',
        in: 'path',
        description: 'The ID of the snapshot',
        required: true,
        schema: { type: 'number', description: 'The ID of the snapshot.' },
      },
    ],
    get: {
      tags: ['main', 'app', 'snapshot'],
      description: 'Get a single snapshot made of the app.',
      operationId: 'getAppSnapshot',
      responses: {
        200: {
          description: 'The snapshot',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer', description: 'The ID of the snapshot.' },
                  yaml: { type: 'string', description: 'The app definition.' },
                  $created: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The creation date of the snapshot.',
                  },
                  $author: {
                    type: 'object',
                    properties: {
                      id: { $ref: '#/components/schemas/User/properties/id' },
                      name: { $ref: '#/components/schemas/User/properties/name' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
