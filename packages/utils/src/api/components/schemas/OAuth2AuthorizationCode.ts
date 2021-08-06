import { OpenAPIV3 } from 'openapi-types';

export const OAuth2AuthorizationCode: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'OAuth2 client credentials',
  required: ['code'],
  additionalProperties: false,
  properties: {
    code: {
      type: 'string',
      description: 'The OAuth2 authorization code.',
      readOnly: true,
    },
  },
};
