import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  // XXX: Temporary workaround until this is fixed in Koas
  // See https://gitlab.com/remcohaszing/koas/-/issues/2
  '/api/apps/{appId}/resources/{resourceType}/\\$count': {
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
        { $ref: '#/components/parameters/$team' },
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
  },
};
