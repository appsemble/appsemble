import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [
    { $ref: '#/components/parameters/appId' },
    { name: 'resourceTypeId', in: 'path', schema: { type: 'string' } },
  ],
  get: {
    tags: ['main', 'app', 'scim'],
    security: [{ scim: [] }],
    operationId: 'getAppScimResourceType',
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
};
