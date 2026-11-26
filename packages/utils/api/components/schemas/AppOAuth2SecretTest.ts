import { type OpenAPIV3 } from 'openapi-types';

export const AppOAuth2SecretTest: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `OAuth2 login settings to test.

The settings may be unsaved. Omitted settings are taken from the stored secret with the given ID.
`,
  additionalProperties: false,
  properties: {
    id: {
      type: 'number',
      description: 'The ID of the stored OAuth2 secret which provides omitted settings.',
    },
    authorizationUrl: { $ref: '#/components/schemas/AppOAuth2Secret/properties/authorizationUrl' },
    tokenUrl: { $ref: '#/components/schemas/AppOAuth2Secret/properties/tokenUrl' },
    clientId: { $ref: '#/components/schemas/AppOAuth2Secret/properties/clientId' },
    clientSecret: { $ref: '#/components/schemas/AppOAuth2Secret/properties/clientSecret' },
    scope: { $ref: '#/components/schemas/AppOAuth2Secret/properties/scope' },
    userInfoUrl: { $ref: '#/components/schemas/AppOAuth2Secret/properties/userInfoUrl' },
    remapper: { $ref: '#/components/schemas/AppOAuth2Secret/properties/remapper' },
    roleMappings: { $ref: '#/components/schemas/AppOAuth2Secret/properties/roleMappings' },
    code: {
      type: 'string',
      description: 'The authorization code the provider returned to a test login.',
    },
  },
};
