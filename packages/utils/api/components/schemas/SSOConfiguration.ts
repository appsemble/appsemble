import { OpenAPIV3 } from 'openapi-types';

export const SSOConfiguration: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A single sign on configuration which is exposed to users.',
  additionalProperties: false,
  properties: {
    url: {
      type: 'string',
      format: 'url',
      description: 'The URL users will be redirected to in the login process.',
    },
    name: {
      type: 'string',
      description: 'A user readable name for the configuration.',
    },
    icon: {
      type: 'string',
      description: 'A Font Awesome icon.',
    },
  },
};
