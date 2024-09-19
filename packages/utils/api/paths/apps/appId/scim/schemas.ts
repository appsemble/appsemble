import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
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
};
