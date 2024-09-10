import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/email': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app'],
      description: 'Get the app’s email settings.',
      operationId: 'getAppEmailSettings',
      responses: {
        200: {
          description: 'The current app email settings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  emailName: {
                    type: 'string',
                    description: 'The name used for emails.',
                  },
                  emailHost: {
                    type: 'string',
                    description: 'The hostname of the SMTP server.',
                  },
                  emailPassword: {
                    type: 'boolean',
                    description: 'Whether a password is set.',
                  },
                  emailUser: {
                    type: 'string',
                    description: 'The username used to authenticate against the SMTP server.',
                  },
                  emailPort: {
                    type: 'string',
                    description: 'The port used for the SMTP server.',
                  },
                  emailSecure: {
                    type: 'boolean',
                    description: 'Whether TLS is being used.',
                  },
                },
              },
            },
          },
        },
      },
      security: [{ studio: [] }, { cli: ['apps:write'] }],
    },
  },
};
