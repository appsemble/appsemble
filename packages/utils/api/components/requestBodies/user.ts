import { OpenAPIV3 } from 'openapi-types';

export const user: OpenAPIV3.RequestBodyObject = {
  description: 'A user profile',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/User',
      },
    },
  },
};
