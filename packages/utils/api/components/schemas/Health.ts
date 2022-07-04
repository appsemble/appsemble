import { OpenAPIV3 } from 'openapi-types';

export const Health: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A health check status',
  readOnly: true,
  additionalProperties: false,
  properties: {
    database: {
      type: 'boolean',
      description: 'Whether or not the database status is healthy',
    },
  },
};
