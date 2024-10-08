import { type OpenAPIV3 } from 'openapi-types';

export const AppAccount: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object representing a member of an app',
  additionalProperties: false,
  properties: {
    app: {
      $ref: '#/components/schemas/App',
      description: 'The app this account is for.',
    },
    appMemberInfo: {
      $ref: '#/components/schemas/AppMemberInfo',
      description: 'The app member info.',
    },
    sso: {
      type: 'array',
      description: 'The single sign on configurations which link the user to an external account.',
      items: { $ref: '#/components/schemas/SSOConfiguration' },
    },
  },
};
