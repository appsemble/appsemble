import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
