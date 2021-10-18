import { OpenAPIV3 } from 'openapi-types';

import { roles } from '../../../constants';

export const Member: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A member of an organization.',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      $ref: '#/components/schemas/User/properties/id',
    },
    name: {
      $ref: '#/components/schemas/User/properties/name',
    },
    primaryEmail: {
      type: 'string',
      format: 'email',
      description: 'The primary email address of the user.',
    },
    role: {
      enum: Object.keys(roles),
    },
    properties: {
      type: 'object',
      description: 'Additional custom properties that a user might have.',
      additionalProperties: { type: 'string' },
    },
  },
};
