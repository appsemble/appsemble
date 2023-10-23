import { type OpenAPIV3 } from 'openapi-types';

export const AppServiceSecret: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'App service secret settings',
  required: ['urlPatterns', 'authenticationMethod'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'number',
      description: 'An autogenerated ID.',
      readOnly: true,
    },
    name: {
      type: 'string',
      description: 'An optional name to give extra clarity what the secret is used for.',
    },
    urlPatterns: {
      type: 'string',
      description: 'The url pattern that is matched when a proxied request action is called.',
    },
    authenticationMethod: {
      enum: [
        'http-basic',
        'client-certificate',
        'client-credentials',
        'cookie',
        'custom-header',
        'query-parameter',
      ],
      description: 'The method to authenticate the request action with.',
    },
    identifier: {
      type: 'string',
      description:
        'The parameter name, header name, username or certificate that goes with the secret.',
    },
    secret: {
      type: 'string',
      description: 'The secret to authenticate the proxied outgoing request with.',
    },
    tokenUrl: {
      type: 'string',
      description: 'The URL to request access tokens from.',
    },
  },
};
