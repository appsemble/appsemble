import { BaseActionDefinition } from './BaseActionDefinition';
import { extendJSONSchema } from './utils';

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
      // XXX Replace the type with a ref once koas-core supports recursive JSON schemas.
      type: 'object',
      // $ref: '#/components/schemas/ActionDefinition',
    },
    else: {
      description: 'This action is called if the `if` remapper yields a falsy value.',
      // XXX Replace the type with a ref once koas-core supports recursive JSON schemas.
      type: 'object',
      // $ref: '#/components/schemas/ActionDefinition',
    },
  },
});
