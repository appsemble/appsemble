import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants/index.js';

export const OrganizationSubscription: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description:
    'A subscription holds permission to what the users withing an organization are allowed to do.',
  required: ['id', 'subscriptionPlan', 'organizationId'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'number',
      description: 'The unique identifier for the subscription.',
    },
    cancelled: {
      type: 'boolean',
      description: 'Whether the subscription will be renewed at the end.',
    },
    cancellationReason: {
      type: 'string',
      description: 'Users reasoning for cancelling the subscription.',
    },
    expirationDate: {
      type: 'string',
      description: 'The expiration date of the subscription.',
      format: 'date-time',
    },
    subscriptionPlan: {
      description: 'The plan associated with the subscription.',
      enum: ['free', 'premium'],
    },
    renewalPeriod: {
      description: 'The renewal period associated with the subscription.',
      enum: ['month', 'year'],
    },
    organizationId: {
      type: 'string',
      pattern: normalized.source,
      minLength: 1,
      maxLength: 30,
      description: 'The unique identifier for the organization.',
    },
  },
};
