import { type OpenAPIV3 } from 'openapi-types';

export const Health: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A health check response in the MicroProfile Health format',
  readOnly: true,
  additionalProperties: false,
  required: ['status', 'checks'],
  properties: {
    status: {
      enum: ['UP', 'DOWN'],
      description: 'The overall status',
    },
    checks: {
      type: 'array',
      description: 'The individual checks the status is based on',
      items: {
        type: 'object',
        description: 'The outcome of one check',
        additionalProperties: false,
        required: ['name', 'status'],
        properties: {
          name: {
            type: 'string',
            description: 'The name of the check',
          },
          status: {
            enum: ['UP', 'DOWN'],
            description: 'The status of the check',
          },
          data: {
            type: 'object',
            description: 'Details about the check',
            additionalProperties: { type: 'string' },
          },
        },
      },
    },
  },
};
