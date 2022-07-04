import { OpenAPIV3 } from 'openapi-types';

export const resource: OpenAPIV3.ResponseObject = {
  description: 'A resource response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Resource',
      },
    },
    'text/csv': {
      schema: {
        type: 'string',
      },
    },
  },
};
