import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

// Although OpenAPI doesn’t support `const` as a value, JSON schema does.
export const JSONSchemaConst = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema which describes a constant',
  additionalProperties: false,
  required: ['const'],
  properties: {
    const: {
      anyOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }, { enum: [null] }],
      description: 'The given value must exactly match one the value specified here.',
    },
  },
});
