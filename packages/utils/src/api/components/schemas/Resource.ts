import type { OpenAPIV3 } from 'openapi-types';

export const Resource: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: {
      type: 'number',
      readOnly: true,
    },
    $clonable: {
      type: 'boolean',
    },
    $expires: {
      type: 'string',
      format: 'date-time',
    },
  },
};
