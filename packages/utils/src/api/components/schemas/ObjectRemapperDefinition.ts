import { OpenAPIV3 } from 'openapi-types';

export const ObjectRemapperDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `An object based remapper is defined by a specific implementation

Object based remappers may only define 1 key. The allowed value depends on the remapper.
`,
  minProperties: 1,
  maxProperties: 1,
  properties: {
    app: {
      enum: ['id'],
      description: `Get app metadata.

Supported properties:

- \`id\`: Get the app id.
`,
    },
    array: {
      enum: ['index', 'length'],
      description: `Get the current array.map’s index or length.

Returns nothing when not in the context of \`array.map’s\`.
`,
    },
    'array.map': {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `Build an array based on the given data and remappers.

The remappers gets applied to each item in the array.

Always returns an array, can be empty if supplied data isn’t an array.
`,
    },
    context: {
      type: 'string',
      description: 'Get a property from the context.',
    },
    'date.add': {
      type: 'string',
      description: 'Add the specified value to a given date.',
    },
    'date.now': {
      enum: ['null'],
      description: 'Returns the current date.',
    },
    'date.parse': {
      type: 'string',
      description: 'Convert a string to a date using a given format.',
    },
    equals: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      description: `Compare all computed remapper values against each other.

Returns \`true\` if all entries are equal, otherwise \`false\`.
`,
    },
    if: {
      type: 'object',
      description: `Check if condition results in a truthy value.

Returns value of then if condition is truthy, otherwise it returns the value of else.
`,
      additionalProperties: false,
      required: ['condition', 'then', 'else'],
      properties: {
        condition: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The condition to check.',
        },
        then: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'This remapper is used if the condition returns true.',
        },
        else: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'This remapper is used if the condition returns false.',
        },
      },
    },
    'object.assign': {
      description: 'Assign properties to an existing object given some predefined mapper keys.',
      additionalProperties: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
    'object.from': {
      description: 'Create a new object given some predefined mapper keys.',
      additionalProperties: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
    prop: {
      type: 'string',
      description: 'Get a property from an object.',
    },
    root: {
      type: 'string',
      description: 'Get the input data as it was initially passed to the remap function.',
    },
    static: {
      description: 'Use a static value.',
    },
    'string.case': {
      enum: ['lower', 'upper'],
      description: 'Convert an input to lower or upper case.',
    },
    'string.format': {
      type: 'object',
      description: 'Format a string using remapped input variables.',
      additionalProperties: false,
      properties: {
        messageId: {
          type: 'string',
          description: 'The message id pointing to the template string to format.',
        },
        template: {
          type: 'string',
          description: 'The template default string to format.',
        },
        values: {
          description: 'A set of remappers to convert the input to usable values.',
          additionalProperties: {
            $ref: '#/components/schemas/RemapperDefinition',
          },
        },
      },
    },
    'string.replace': {
      type: 'object',
      description: 'Match the content with the regex in the key, and replace it with its value.',
      minProperties: 1,
      maxProperties: 1,
      additionalProperties: {
        type: 'string',
      },
    },
    translate: {
      type: 'string',
      description: `Translate using a messageID.

This does not support parameters, for more nuanced translations use \`string.format\`.
`,
    },
    user: {
      enum: ['sub', 'name', 'email', 'email_verified', 'picture', 'profile', 'locale'],
      description: 'Get a user property from the OpenID user info.',
    },
  },
};
