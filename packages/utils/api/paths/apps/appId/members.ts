import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['app'],
    description: 'Fetch all members of an app.',
    operationId: 'getAppMembers',
    responses: {
      200: {
        description: 'The list of app members.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrganizationMember',
              },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, { app: ['openid'] }],
  },
};
