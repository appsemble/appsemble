import { OpenAPIV3 } from 'openapi-types';

export const organization: OpenAPIV3.ResponseObject = {
  description: 'An organization response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Organization',
      },
    },
  },
};
