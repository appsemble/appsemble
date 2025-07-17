import { type OpenAPIV3 } from 'openapi-types';

export const WebhookDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  required: ['schema', 'action'],
  description:
    'A webhook definition defines app specific callable endpoints that Appsemble can handle.',
  additionalProperties: false,
  properties: {
    schema: {
      $ref: '#/components/schemas/JSONSchemaRoot',
      description: 'JSON schema definition of the payload.',
    },
    action: {
      description: 'The action to run when the webhook is triggered.',
      $ref: '#/components/schemas/ActionDefinition',
    },
  },
};
