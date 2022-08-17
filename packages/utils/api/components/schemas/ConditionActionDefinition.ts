import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ConditionActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'if'],
  properties: {
    type: {
      enum: ['condition'],
      description: 'Run another action if a certain contition is met.',
    },
    if: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `A remapper to determine the condition to check.

If this yields a truthy value, the \`then\` action is called. Otherwise the \`else\` action is
called.
`,
    },
    then: {
      description: 'This action is called if the `if` remapper yields a truthy value.',
      $ref: '#/components/schemas/ActionDefinition',
    },
    else: {
      description: 'This action is called if the `if` remapper yields a falsy value.',
      $ref: '#/components/schemas/ActionDefinition',
    },
  },
});
