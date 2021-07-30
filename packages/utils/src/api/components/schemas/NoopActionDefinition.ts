import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

export const NoopActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['noop'],
      description: `Do nothing when this action is triggered.

This is the default action for block actions that are not required.
`,
    },
  },
});
