import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { $ref: '#/components/parameters/resourceType' },
    { $ref: '#/components/parameters/selectedGroupId' },
    {
      name: '$own',
      schema: { type: 'boolean' },
      description: 'If the resources created by the authenticated app member should be included',
      in: 'query',
    },
  ],
  get: {
    tags: ['common', 'app', 'resource'],
    description: 'Get a count of all resources of this app.',
    operationId: 'countAppResources',
    parameters: [{ $ref: '#/components/parameters/$filter' }],
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
