import { type OpenAPIV3 } from 'openapi-types';

export const EventsDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object describing the names of the events the block can listen and emit to.',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    listen: {
      type: 'object',
      description: `This property defines the events this block will listen on.

The key is the name of the event will listen on. The value is a user defined event name which should
match the name of an emitted event on the same page.
`,
      minProperties: 1,
      additionalProperties: { type: 'string' },
    },
    emit: {
      type: 'object',
      description: `This property defines the events this block will emit.

The key is the name of the event will emit. The value is a user defined event name which should
match the name of a event on the same page that’s being listened on.
`,
      minProperties: 1,
      additionalProperties: { type: 'string' },
    },
  },
};
