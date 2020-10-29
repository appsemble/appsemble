import { OpenAPIV3 } from 'openapi-types';

export const cli: OpenAPIV3.OAuth2SecurityScheme = {
  type: 'oauth2',
  // @ts-expect-error This is valid.
  description: `
    OAuth2 login for client credentials.

    For example the Appsemble CLI uses this.
  `,
  flows: {
    clientCredentials: {
      tokenUrl: '/oauth2/token',
      scopes: {
        'apps:write': 'Create and update apps',
        'blocks:write': 'Register and update blocks, and publish new block versions.',
        'organizations:write': 'Create and manage organizations.',
        'resources:manage': 'Manage app resources on behalf of a user.',
      },
    },
  },
};
