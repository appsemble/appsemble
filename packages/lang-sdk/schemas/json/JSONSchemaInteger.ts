import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const JSONSchemaInteger = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for an integer.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['integer'],
      description: 'The type of the JSON schema. An integer means a fractionless number.',
    },
    examples: {
      type: 'array',
      items: {
        type: 'integer',
        description: 'An example integer which is valid according to this schema.',
      },
    },
    default: {
      type: 'integer',
      description: 'The default value which is used if no value is supplied.',
    },
    enum: {
      type: 'array',
      description: 'If an enum is specified, the type can be safely removed.',
      items: {
        type: 'integer',
      },
    },
    const: {
      type: 'integer',
      description: 'If const is specified, the type can be safely removed.',
    },
    minimum: {
      type: 'integer',
      description: 'The minimum value of the number.',
      example: 0,
    },
    maximum: {
      type: 'integer',
      description: 'The maximum value of the number.',
      example: 100,
    },
    multipleOf: {
      type: 'integer',
      description: `The value must be a multiple of this number.

For example, if this is set to 3, then the values 0, 3, 6, 9, etc. will be allowed, but not 1, 2, 4,
5, 7, 8, etc.
`,
    },
  },
});
