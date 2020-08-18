import type { OpenAPIV3 } from 'openapi-types';

export const resource: OpenAPIV3.RequestBodyObject = {
  description: 'A resource definition',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Resource',
      },
    },
  },
};
