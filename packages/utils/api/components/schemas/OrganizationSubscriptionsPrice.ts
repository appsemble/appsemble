import { type OpenAPIV3 } from 'openapi-types';

export const OrganizationSubscriptionPrice: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A subscription price holds pricing information about the subscription.',
  required: ['basePrice'],
  additionalProperties: false,
  properties: {
    totalPrice: {
      type: 'number',
      description: 'The total price.',
    },
    basePrice: {
      type: 'number',
      description: 'Base price without VAT',
    },
    vatPercentage: {
      type: 'number',
      description: 'The VAT that applies to the transaction.',
    },
    vatAmount: {
      type: 'number',
      description: 'The VAT amount that applies to the transaction.',
    },
  },
};
