import { OpenAPIV3 } from 'openapi-types';

export const EventsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object describing the names of the events the block can listen and emit to.',
  properties: {
    listen: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    emit: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  },
};
