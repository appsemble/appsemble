import { type OpenAPIV3 } from 'openapi-types';

export const ScimSecret: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'An app’s SCIM configuration.',
  properties: {
    enabled: {
      type: 'boolean',
      description: 'Whether or not SCIM is enabled for the app.',
    },
    token: {
      type: 'string',
      description: 'The secret SCIM token',
    },
  },
};
