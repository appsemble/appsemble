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
      description:
        'The secret SCIM token. Responses never include it. An update without it keeps the stored value.',
      writeOnly: true,
    },
    incomplete: {
      type: 'boolean',
      description: 'Whether the SCIM token has no value yet.',
      readOnly: true,
    },
  },
};
