import { OpenAPIV3 } from 'openapi-types';

export const BaseActionDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    remap: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'This may be used to remap data before it is passed into the action function.',
    },
    onSuccess: {
      $ref: '#/components/schemas/ActionDefinition',
      description:
        'Another action that is dispatched when the action has been dispatched successfully.',
    },
    onError: {
      $ref: '#/components/schemas/ActionDefinition',
      description:
        'Another action that is dispatched when the action has failed to dispatch successfully.',
    },
  },
};
