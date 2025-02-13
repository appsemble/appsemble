import { type OpenAPIV3 } from 'openapi-types';

export const Training: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Object representation of a training',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      description: 'Id of the training',
    },
  },
};
