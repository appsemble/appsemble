import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const StaticActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'value'],
  properties: {
    type: {
      enum: ['static'],
      description: `The \`static\` action returns static data defined in the action definition.

This is useful for example for stubbing data.
`,
    },
    value: {
      description: 'The static value to return.',
    },
  },
});
