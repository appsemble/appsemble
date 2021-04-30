import { OpenAPIV3 } from 'openapi-types';

export const FlowPageActionsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'These actions are fired on a flow page.',
  properties: {
    onFlowCancel: {
      $ref: '#/components/schemas/ActionDefinition',
    },
    onFlowFinish: {
      $ref: '#/components/schemas/ActionDefinition',
    },
  },
};
