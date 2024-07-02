import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/scim/ServiceProviderConfig': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app', 'scim'],
      security: [{ scim: [] }],
      operationId: 'getAppScimServiceProviderConfig',
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
