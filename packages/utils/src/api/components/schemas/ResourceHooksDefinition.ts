import { OpenAPIV3 } from 'openapi-types';

export const ResourceHooksDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Hooks that are triggered upon calling a resource action.',
  properties: {
    notification: { $ref: '#/components/schemas/NotificationHookDefinition' },
  },
};
