import { OpenAPIV3 } from 'openapi-types';

export const app: OpenAPIV3.ResponseObject = {
  description: 'An app response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/App',
      },
    },
  },
};
