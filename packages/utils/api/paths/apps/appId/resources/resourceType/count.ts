import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
  ],
  get: {
    tags: ['common', 'app', 'resource'],
    description: 'Get a count of all resources of this app.',
    operationId: 'countAppResources',
    parameters: [
      { $ref: '#/components/parameters/$filter' },
      { in: 'query', name: 'groupId', schema: { type: 'number' } },
    ],
    responses: {
      200: {
        description: 'The count of all this app’s resources of this type.',
        content: {
          'application/json': {
            schema: {
              type: 'number',
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['resources:manage'] }, { cli: ['resources:read'] }, {}],
  },
};
