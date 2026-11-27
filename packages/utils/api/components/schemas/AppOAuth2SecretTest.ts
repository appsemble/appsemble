import { type OpenAPIV3 } from 'openapi-types';

export const AppOAuth2SecretTest: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `OAuth2 login settings to test.

The settings may be unsaved. A body with only an ID tests the stored secret with that ID. Otherwise
an omitted client secret is taken from that stored secret, if the token URL is the stored one.
`,
  additionalProperties: false,
  properties: {
    id: {
      type: 'number',
      description:
        'The ID of the stored OAuth2 secret to test, or which provides an omitted client secret.',
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
