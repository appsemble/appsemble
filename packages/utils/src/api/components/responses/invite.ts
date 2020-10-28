import { OpenAPIV3 } from 'openapi-types';

export const invite: OpenAPIV3.ResponseObject = {
  description: 'An invite response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Organization',
      },
    },
  },
};
