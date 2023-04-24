import { type OpenAPIV3 } from 'openapi-types';

export const blockVersion: OpenAPIV3.ResponseObject = {
  description: 'A block definition response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/BlockVersion',
      },
    },
  },
};
