import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from './utils.js';

// Allow remappers without specifying a type.
export const JSONSchemaRemapper = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema which allows a format of remapper without a type.',
  additionalProperties: false,
  required: ['format'],
  properties: {
    format: {
      enum: ['remapper'],
      description: 'Allow a remapper definition. This is supported for blocks only.',
    },
    default: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
});
