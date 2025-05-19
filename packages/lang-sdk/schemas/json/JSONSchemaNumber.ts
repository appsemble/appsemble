import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const JSONSchemaNumber = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for a number which has fractions.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['number'],
      description:
        'The type of the JSON schema. A number represents a number which has fractions. For fractionless numbers, use `integer` instead.',
    },
    enum: {
      type: 'array',
      description: 'If an enum is specified, the type can be safely removed.',
      items: {
        type: 'number',
      },
    },
    const: {
      type: 'number',
      description: 'If const is specified, the type can be safely removed.',
    },
    examples: {
      type: 'array',
      items: {
        type: 'number',
        description: 'An example number which is valid according to this schema.',
      },
    },
    default: {
      type: 'number',
      description: 'The default value which is used if no value is supplied.',
    },
    minimum: {
      type: 'number',
      description: 'The minimum value of the number.',
      example: 0,
    },
    maximum: {
      type: 'number',
      description: 'The maximum value of the number.',
      example: 100,
    },
    exclusiveMinimum: {
      type: 'number',
      description:
        'The value must be bigger than this number. The given value itself is not allowed.',
    },
    exclusiveMaximum: {
      type: 'number',
      description:
        'The value must be smaller than this number. The given value itself is not allowed.',
    },
    multipleOf: {
      type: 'number',
      description: `The value must be a multiple of this number.

For example, if this is set to 0.5, then the values 0, 0.5, 1, 1.5, 2, 2.5, etc. will be allowed,
but not 0.3, 1.7, etc.
`,
    },
  },
});
