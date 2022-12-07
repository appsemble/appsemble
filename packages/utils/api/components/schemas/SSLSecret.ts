import { OpenAPIV3 } from 'openapi-types';

export const SSLSecret: OpenAPIV3.SchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'The SSL secret of an app.',
  properties: {
    certificate: {
      type: 'string',
      description: 'The fully resolved SSL certificate in PEM format.',
    },
    key: {
      type: 'string',
      description: 'The fully SSL key in PEM format.',
    },
  },
};
