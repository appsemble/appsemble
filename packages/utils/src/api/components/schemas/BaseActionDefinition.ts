import { OpenAPIV3 } from 'openapi-types';

export const BaseActionDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  properties: {
    remap: {
      $ref: '#/components/schemas/RemapperDefinition',
      description: 'This may be used to remap data before it is passed into the action function.',
    },
    onSuccess: {
      // XXX Replace the type with a ref once koas-core supports recursive JSON schemas.
      type: 'object',
      // $ref: '#/components/schemas/ActionDefinition',
      description:
        'Another action that is dispatched when the action has been dispatched successfully.',
    },
    onError: {
      // XXX Replace the type with a ref once koas-core supports recursive JSON schemas.
      type: 'object',
      // $ref: '#/components/schemas/ActionDefinition',
      description:
        'Another action that is dispatched when the action has failed to dispatch successfully.',
    },
  },
};
