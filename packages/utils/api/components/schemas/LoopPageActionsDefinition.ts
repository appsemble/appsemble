import { type OpenAPIV3 } from 'openapi-types';

export const LoopPageActionsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'These actions are fired on a loop page.',
  required: ['onLoad'],
  additionalProperties: false,
  properties: {
    onLoad: {
      $ref: '#/components/schemas/ActionDefinition',
      description: 'This action is used to define the data to pass onto the loop type array',
    },
    onFlowCancel: {
      $ref: '#/components/schemas/ActionDefinition',
      description: 'This action gets triggered when `flow.cancel` gets called.',
    },
    onFlowFinish: {
      $ref: '#/components/schemas/ActionDefinition',
      description: `This action gets triggered when a flow is finished.

A flow is finished when \`flow.finish\` gets called, or when \`flow.next\` gets called on the final
subpage. This action has a special property in which the cumulative input data from each previous subpage gets sent, instead of the individual block that triggered this action.`,
    },
  },
};
