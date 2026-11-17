import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/organizationId' }],
  post: {
    tags: ['main', 'organization', 'auth'],
    operationId: 'completeOrganizationSsoLogin',
    description: 'Complete an organization OIDC sign-in using its browser-bound login state.',
    security: [{ studio: [] }, {}],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['code', 'state', 'timezone'],
            properties: {
              code: { type: 'string', minLength: 1 },
              state: { type: 'string', minLength: 1 },
              iss: { type: 'string', format: 'uri' },
              timezone: { type: 'string', minLength: 1 },
            },
          },
        },
      },
    },
    responses: { 200: { description: 'The authenticated Studio token response.' } },
  },
};
