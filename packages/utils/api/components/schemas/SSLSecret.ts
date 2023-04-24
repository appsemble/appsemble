import { type OpenAPIV3 } from 'openapi-types';

export const SSLSecret: OpenAPIV3.SchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'The SSL secret of an app.',
  properties: {
    certificate: {
      type: 'string',
      description: 'The public SSL certificate chain in PEM format.',
    },
    key: {
      type: 'string',
      description: 'The SSL private key in PEM format.',
    },
  },
};
