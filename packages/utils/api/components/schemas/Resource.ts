import { type OpenAPIV3 } from 'openapi-types';

export const Resource: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: true,
  description: 'A resource can be anything defined as described in an app resource definition.',
  properties: {
    id: {
      type: 'number',
      readOnly: true,
    },
    $clonable: {
      type: 'boolean',
    },
    $ephemeral: {
      type: 'boolean',
    },
    $expires: {
      anyOf: [
        {
          type: 'string',
          format: 'date-time',
        },
        {
          type: 'string',
          pattern:
            /^(\d+(y|yr|years))?\s*(\d+months)?\s*(\d+(w|wk|weeks))?\s*(\d+(d|days))?\s*(\d+(h|hr|hours))?\s*(\d+(m|min|minutes))?\s*(\d+(s|sec|seconds))?$/
              .source,
        },
      ],
    },
  },
};
