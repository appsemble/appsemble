import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'member', 'current-member'],
    description: 'Link the app member to an unlinked authorization.',
    operationId: 'linkCurrentAppMember',
    security: [{ app: [] }],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              externalId: {
                type: 'string',
                description: `The external id of the of the external user.

The \`externalId\` maps to the following ids of the external login methods.
- Appsemble OAuth2 login: \`UserId\`
- App OAuth2 login: \`sub\`
- App SAML login: \`nameId\`
`,
              },
              secret: {
                type: 'string',
                description: 'The secret that was used to get the external id.',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: '',
        content: {},
      },
    },
  },
};
