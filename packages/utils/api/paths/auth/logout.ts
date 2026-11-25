import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'auth'],
    operationId: 'logout',
    description: 'Revoke the current organization SSO session.',
    security: [{ studio: [] }],
    responses: {
      200: {
        description: 'The current session has been revoked.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                endSessionUrl: {
                  type: 'string',
                  format: 'uri',
                  description:
                    'The identity provider URL which ends the organization SSO session and returns to the Studio.',
                },
              },
            },
          },
        },
      },
    },
  },
};
