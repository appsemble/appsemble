import { BaseActionDefinition } from './BaseActionDefinition.js';
import { extendJSONSchema } from './utils.js';

export const ControllerActionDefinition = extendJSONSchema(BaseActionDefinition, {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'handler'],
  properties: {
    type: {
      enum: ['controller'],
      description: 'Use the controller to handle the action.',
    },
    handler: {
      type: 'string',
      description: 'The name of the function in the controller that will handle the action',
    },
  },
});
