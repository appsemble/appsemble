import { type OpenAPIV3 } from 'openapi-types';

export const organizationSubscriptionPrice: OpenAPIV3.ResponseObject = {
  description: 'A subscription price response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/OrganizationSubscriptionPrice',
      },
    },
  },
};
