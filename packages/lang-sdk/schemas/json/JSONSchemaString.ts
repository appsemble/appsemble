import { BaseJSONSchema } from './BaseJSONSchema.js';
import { extendJSONSchema } from '../utils/extendJSONSchema.js';

export const JSONSchemaString = extendJSONSchema(BaseJSONSchema, {
  type: 'object',
  description: 'A JSON schema for a string.',
  additionalProperties: false,
  required: ['type'],
  properties: {
    type: {
      enum: ['string'],
      description:
        'The type of the JSON schema. A string is the technical term for a piece of text.',
    },
    examples: {
      type: 'array',
      items: {
        type: 'string',
        description: 'An example string which is valid according to this schema.',
      },
    },
    default: {
      type: 'string',
      description: 'The default value which is used if no value is supplied.',
    },
    enum: {
      type: 'array',
      description: 'If an enum is specified, the type can be safely removed.',
      items: {
        type: 'string',
      },
    },
    const: {
      type: 'string',
      description: 'If const is specified, the type can be safely removed.',
    },
    format: {
      // https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
      enum: [
        // https://json-schema.org/understanding-json-schema/reference/string.html#dates-and-times
        'date-time',
        'time',
        'date',
        'duration',

        // https://json-schema.org/understanding-json-schema/reference/string.html#email-addresses
        'email',
        'idn-email',

        // https://json-schema.org/understanding-json-schema/reference/string.html#hostnames
        'hostname',
        'idn-hostname',

        // https://json-schema.org/understanding-json-schema/reference/string.html#ip-addresses
        'ipv4',
        'ipv6',

        // https://json-schema.org/understanding-json-schema/reference/string.html#resource-identifiers
        'uuid',
        'uri',
        'uri-reference',
        'iri',
        'iri-reference',

        // https://json-schema.org/understanding-json-schema/reference/string.html#uri-template
        'uri-template',

        // https://json-schema.org/understanding-json-schema/reference/string.html#json-pointer
        'json-pointer',
        'relative-json-pointer',

        // https://json-schema.org/understanding-json-schema/reference/string.html#index-12
        'regex',

        // Custom
        'action',
        'binary',
        'event-emitter',
        'event-listener',
        'fontawesome',
      ],
      description: 'The format values should adhere to.',
    },
    minLength: {
      type: 'integer',
      description: 'The minimum length of the string.',
      minimum: 1,
    },
    maxLength: {
      type: 'integer',
      description: `The maximum length of the string.

It’s highly recommended to set this property, even if it’s a big number. For example 5000 characters
is plenty for most larger input fields. Not doing so may result in extremely large user input, which
results in a bad user experience.
`,
      minimum: 1,
      example: 5000,
    },
    pattern: {
      type: 'string',
      description: `A regular expression to describe user input.

Regular expressions are a powerful way to enforce proper user input, but the learning curve is high.
If you don’t know what this is, we recommend to omit this field for now.
`,
      minLength: 1,
      format: 'regex',
    },
    multiline: {
      type: 'boolean',
      description: 'If true, Appsemble renders a textarea in the graphical JSON editor.',
      default: false,
    },
  },
});
