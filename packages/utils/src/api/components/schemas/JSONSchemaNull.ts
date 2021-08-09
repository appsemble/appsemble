import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

// Although OpenAPI doesn’t support `null` as a value, JSON schema does.
export const JSONSchemaNull = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema of type null only accepts a null value',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['null'],
      description: 'Only accept a null value.',
    },
  },
});
