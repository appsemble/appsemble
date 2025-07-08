import { JSONSchemaObject } from './JSONSchemaObject.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const JSONSchemaRoot = extendJSONSchema(JSONSchemaObject, {
  type: 'object',
  description: 'A top level JSON schema.',
  additionalProperties: false,
  properties: {
    definitions: {
      description:
        'This property may be used to store JSON schemas that may be referenced from other places.',
      additionalProperties: {
        $ref: '#/components/schemas/JSONSchema',
      },
    },
    $schema: {
      description:
        'The JSON schema meta schema. You probably don’t need to specify this explicitly.',
      enum: ['http://json-schema.org/draft-04/schema#', 'http://json-schema.org/draft-07/schema#'],
      default: 'http://json-schema.org/draft-07/schema#',
    },
  },
});
