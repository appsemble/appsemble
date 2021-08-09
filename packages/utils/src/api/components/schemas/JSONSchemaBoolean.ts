import { BaseJSONSchema } from './BaseJSONSchema';
import { extendJSONSchema } from './utils';

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
    example: {
      type: 'boolean',
      description: 'An example boolean which is valid according to this schema.',
    },
    default: {
      type: 'boolean',
      description: 'The default value which is used if no value is supplied.',
    },
  },
});
