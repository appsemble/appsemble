import { OpenAPIV3 } from 'openapi-types';

export const CronDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  required: ['schedule'],
  properties: {
    schedule: {
      type: 'string',
    },
    action: {
      type: 'object',
      description: 'A mapping of actions that can be fired by the cronjob.',
      additionalProperties: {
        $ref: '#/components/schemas/ActionDefinition',
      },
    },
  },
};
