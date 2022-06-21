import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const ThrowActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['throw'],
      description: `This action throws a new exception based on the data that is passed through.

This can be used to create a custom error that ends up in the error action handler.
`,
    },
  },
});
