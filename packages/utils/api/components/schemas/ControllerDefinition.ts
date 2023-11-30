import { type OpenAPIV3 } from 'openapi-types';

export const ControllerDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'A controller for application logic.',
  required: [],
  additionalProperties: false,
  properties: {
    actions: {
      type: 'object',
      description: 'A mapping of actions that can be fired by the controller to action handlers.',
      additionalProperties: {
        $ref: '#/components/schemas/ActionDefinition',
      },
    },
    events: { $ref: '#/components/schemas/EventsDefinition' },
  },
};
