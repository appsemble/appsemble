import { type OpenAPIV3 } from 'openapi-types';

export const organizationSubscription: OpenAPIV3.ResponseObject = {
  description: 'A subscription response',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/OrganizationSubscription',
      },
    },
  },
};
