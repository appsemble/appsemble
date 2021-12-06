import { OpenAPIV3 } from 'openapi-types';

export const ActionDefinition: OpenAPIV3.NonArraySchemaObject = {
  allOf: [
    {
      type: 'object',
      description: 'The base properties of an action definition.',
      additionalProperties: true,
      properties: {
        remap: {
          $ref: '#/components/schemas/RemapperDefinition',
          description:
            'This may be used to remap data before it is passed into the action function.',
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
    },
    {
      anyOf: [
        { $ref: '#/components/schemas/AnalyticsActionDefinition' },
        { $ref: '#/components/schemas/DialogErrorActionDefinition' },
        { $ref: '#/components/schemas/DialogOkActionDefinition' },
        { $ref: '#/components/schemas/EmailActionDefinition' },
        { $ref: '#/components/schemas/FlowBackActionDefinition' },
        { $ref: '#/components/schemas/FlowFinishActionDefinition' },
        { $ref: '#/components/schemas/FlowNextActionDefinition' },
        { $ref: '#/components/schemas/LinkBackActionDefinition' },
        { $ref: '#/components/schemas/LinkNextActionDefinition' },
        { $ref: '#/components/schemas/NoopActionDefinition' },
        { $ref: '#/components/schemas/TeamJoinActionDefinition' },
        { $ref: '#/components/schemas/TeamListActionDefinition' },
        { $ref: '#/components/schemas/ThrowActionDefinition' },
        { $ref: '#/components/schemas/ConditionActionDefinition' },
        { $ref: '#/components/schemas/DialogActionDefinition' },
        { $ref: '#/components/schemas/EventActionDefinition' },
        { $ref: '#/components/schemas/FlowToActionDefinition' },
        { $ref: '#/components/schemas/LinkActionDefinition' },
        { $ref: '#/components/schemas/LogActionDefinition' },
        { $ref: '#/components/schemas/MessageActionDefinition' },
        { $ref: '#/components/schemas/RequestActionDefinition' },
        { $ref: '#/components/schemas/ResourceCountActionDefinition' },
        { $ref: '#/components/schemas/ResourceCreateActionDefinition' },
        { $ref: '#/components/schemas/ResourceDeleteActionDefinition' },
        { $ref: '#/components/schemas/ResourceGetActionDefinition' },
        { $ref: '#/components/schemas/ResourceQueryActionDefinition' },
        { $ref: '#/components/schemas/ResourceSubscriptionStatusActionDefinition' },
        { $ref: '#/components/schemas/ResourceSubscriptionSubscribeActionDefinition' },
        { $ref: '#/components/schemas/ResourceSubscriptionToggleActionDefinition' },
        { $ref: '#/components/schemas/ResourceSubscriptionUnsubscribeActionDefinition' },
        { $ref: '#/components/schemas/ResourceUpdateActionDefinition' },
        { $ref: '#/components/schemas/StorageReadActionDefinition' },
        { $ref: '#/components/schemas/StorageWriteActionDefinition' },
        { $ref: '#/components/schemas/ShareActionDefinition' },
        { $ref: '#/components/schemas/ShareActionDefinition' },
        { $ref: '#/components/schemas/StaticActionDefinition' },
        { $ref: '#/components/schemas/StorageReadActionDefinition' },
        { $ref: '#/components/schemas/StorageWriteActionDefinition' },
        { $ref: '#/components/schemas/UserLoginActionDefinition' },
        { $ref: '#/components/schemas/UserRegisterActionDefinition' },
        { $ref: '#/components/schemas/UserUpdateActionDefinition' },
      ],
    },
  ],
};
