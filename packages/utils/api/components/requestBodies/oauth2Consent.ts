import { type OpenAPIV3 } from 'openapi-types';

export const oauth2Consent: OpenAPIV3.RequestBodyObject = {
  description: 'The OAuth2 client credentials',
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['redirectUri', 'scope'],
        description: 'A representation of a user’s OAuth2 consent when logging in to an app.',
        additionalProperties: false,
        properties: {
          redirectUri: {
            type: 'string',
            format: 'uri',
            description: 'The URI to redirect the user back to.',
          },
          scope: {
            type: 'string',
            description: 'The OAuth2 scope requested by the app.',
          },
        },
      },
    },
  },
};
