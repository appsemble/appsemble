import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { name: 'schemaId', in: 'path', schema: { type: 'string' } },
  ],
  get: {
    tags: ['main', 'app', 'scim'],
    security: [{ scim: [] }],
    operationId: 'getAppScimSchema',
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
