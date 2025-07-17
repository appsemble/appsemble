import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const JSONSchemaObject = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for an object.',
  additionalProperties: false,
  required: ['type', 'additionalProperties'],
  properties: {
    type: {
      enum: ['object'],
      description: 'The type of the JSON schema.',
    },
    examples: {
      type: 'array',
      items: {
        type: 'object',
        description: 'An example object which is valid according to this schema.',
        additionalProperties: true,
      },
    },
    default: {
      type: 'object',
      description: 'The default value which is used if no value is supplied.',
      additionalProperties: true,
    },
    maxProperties: {
      type: 'integer',
      description: 'The maximum number of properties the object is allowed to have.',
      minimum: 0,
    },
    minProperties: {
      type: 'integer',
      description: 'The minimum number of properties the object is must have.',
      minimum: 1,
    },
    required: {
      type: 'array',
      description: 'A list of properties that are required.',
      minItems: 1,
      items: {
        type: 'string',
        description: 'A property name which is required on the object.',
      },
    },
    properties: {
      type: 'object',
      description: 'A mapping of object keys for the object to nested JSON schemas.',
      additionalProperties: {
        $ref: '#/components/schemas/JSONSchema',
      },
    },
    additionalProperties: {
      description: `Describe if this object is allowed to have properties besides those defined in \`properties\`

It’s recommended to set this to \`false\`.
`,
      example: false,
      anyOf: [
        {
          type: 'boolean',
          description: `If false, the object may not have any additional properties.

If true, the object may have **any** type of additional properties. This is **not** recommended.
`,
        },
        {
          $ref: '#/components/schemas/JSONSchema',
          description: 'If this is a JSON schema, it describes any additional properties.',
        },
      ],
    },
  },
});
