import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['main', 'app', 'secret', 'oauth2'],
    operationId: 'testAppOAuth2SecretLogin',
    description: `Complete a test login with an OAuth2 provider.

This exchanges the authorization code the provider returned to the Studio callback, and reports what
a login would read from it. It creates no app member and no authorization.
`,
    security: [{ studio: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            allOf: [{ $ref: '#/components/schemas/AppOAuth2SecretTest' }, { required: ['code'] }],
          },
        },
      },
    },
    responses: {
      200: {
        description: 'What a login would read from the provider, or why it failed.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    check: { type: 'string' },
                    reason: { type: 'string' },
                    detail: { type: 'string' },
                  },
                },
                idToken: { type: 'object' },
                accessToken: { type: 'object' },
                userInfo: {},
                user: { type: 'object' },
                roles: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
};
