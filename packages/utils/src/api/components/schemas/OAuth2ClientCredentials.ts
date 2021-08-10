import { OpenAPIV3 } from 'openapi-types';

import { scopes } from '../../../constants';

export const OAuth2ClientCredentials: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'OAuth2 client credentials',
  required: ['description', 'scopes'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      description: 'The generated client id',
      readOnly: true,
    },
    secret: {
      type: 'string',
      description: 'The generated client secret',
      readOnly: true,
    },
    description: {
      type: 'string',
      description: 'A description for the user to recognize the client.',
      maxLength: 50,
    },
    expires: {
      type: 'string',
      description: 'When the client credentials expire automatically.',
      format: 'date-time',
    },
    scopes: {
      type: 'array',
      description: 'The scopes that have been granted to the client.',
      items: {
        enum: [...scopes],
      },
    },
  },
};
