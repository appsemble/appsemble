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
    $expires: {
      type: 'string',
      format: 'date-time',
    },
  },
};
