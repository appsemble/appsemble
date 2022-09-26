import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from './utils.js';

export const JSONSchemaBoolean = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for a boolean.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['boolean'],
      description: 'The type of the JSON schema. A boolean means either true or false.',
    },
    examples: {
      type: 'array',
      items: {
        type: 'boolean',
        description: 'An example boolean which is valid according to this schema.',
      },
    },
    default: {
      type: 'boolean',
      description: 'The default value which is used if no value is supplied.',
    },
    enum: {
      type: 'array',
      description: 'If an enum is specified, the type can be safely removed.',
      items: {
        type: 'boolean',
      },
    },
    const: {
      type: 'boolean',
      description: 'If const is specified, the type can be safely removed.',
    },
  },
});
