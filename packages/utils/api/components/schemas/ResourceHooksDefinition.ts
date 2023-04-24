import { type OpenAPIV3 } from 'openapi-types';

export const ResourceHooksDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Hooks that are triggered upon calling a resource action.',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    notification: { $ref: '#/components/schemas/NotificationHookDefinition' },
  },
};
