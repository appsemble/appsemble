import { OpenAPIV3 } from 'openapi-types';

export const oauth2AuthorizationCode: OpenAPIV3.ResponseObject = {
  description: 'An OAuth2 authorization code.',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/App',
      },
    },
  },
};
