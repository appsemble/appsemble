import { OpenAPIV3 } from 'openapi-types';

export const ObjectRemapperDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `An object based remapper is defined by a specific implementation

Object based remappers may only define 1 key. The allowed value depends on the remapper.
`,
  minProperties: 1,
  maxProperties: 1,
  additionalProperties: false,
  properties: {
    app: {
      enum: ['id', 'locale', 'url'],
      description: `Get app metadata.

Supported properties:

- \`id\`: Get the app id.
- \`locale\`: Get the current locale of the app.
- \`url\`: Get the base URL of the app.
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
    'array.unique': {
      $ref: '#/components/schemas/RemapperDefinition',
      description: `Filters out unique entries from an array.

The value Remapper is applied to each entry in the array,
using its result to determine uniqueness.

If the value Remapper result in \`undefined\` or \`null\`, the entire entry is used for uniqueness.

If the input is not an array, the input is returned without any modifications.`,
    },
    'array.from': {
      type: 'array',
      items: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      description: 'Create a new array with an array of predefined remappers.',
    },
    'array.append': {
      type: 'array',
      items: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      description: `Append new values to the end of an array.

If the input is not an array an empty array is returned.`,
    },
    'array.omit': {
      type: 'array',
      items: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
      description: `Remove item(s) from an array given a predefined array of remappable indices.

Only the remapped values that are turned into numbers are applied.

If the input is not an array an empty array is returned.`,
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
      enum: [null],
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
    step: {
      type: 'string',
      description: 'Get flow page step current data',
    },
    gt: {
      type: 'array',
      description: `Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is greater than the second entry.`,
      minItems: 2,
      maxItems: 2,
      items: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
    ics: {
      type: 'object',
      description: 'Create a calendar event',
      additionalProperties: false,
      required: ['start', 'title'],
      properties: {
        start: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The start of the icalendar event.',
        },
        end: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The end of the icalendar event.',
        },
        duration: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The duration of the event.',
          example: '1w 3d 10h 30m',
        },
        title: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The title of the event.',
        },
        description: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'An optional description of the event.',
        },
        url: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'An optional link to attach to the event.',
        },
        location: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'An optional location description to attach to the event.',
        },
        coordinates: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: `An optional geolocation description to attach to the event.

This must be an object with the properties \`lat\` or \`latitude\`, and \`lon\`, \`lng\` or \`longitude\`.`,
        },
      },
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
    lt: {
      type: 'array',
      description: `Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is lesser than the second entry.`,
      minItems: 2,
      maxItems: 2,
      items: {
        $ref: '#/components/schemas/RemapperDefinition',
      },
    },
    'null.strip': {
      description: 'Strip all null, undefined, and empty array values from an object.',
      anyOf: [
        { enum: [null] },
        {
          type: 'object',
          required: ['depth'],
          additionalProperties: false,
          description: 'Options for the null.strip remapper.',
          properties: {
            depth: {
              type: 'integer',
              minimum: 1,
              description: 'How deep to recurse into objects and arrays to remove null values.',
            },
          },
        },
      ],
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
    'object.omit': {
      description: `Remove properties from an existing object based on the given the object keys.

Nested properties can be removed using arrays of keys.

For example:
\`\`\`yaml
object.omit:
  - foo   # Removes the property foo
  - - bar # Removes the property baz inside of bar
    - baz
\`\`\`
`,
      type: 'array',
      items: {
        minItems: 1,
        anyOf: [
          { type: 'string' },
          {
            type: 'array',
            minItems: 2,
            items: {
              type: 'string',
            },
          },
        ],
      },
    },
    page: {
      enum: ['data', 'url'],
      description: `Get page metadata.

Supported properties:

- \`data\`: Get the current page data.
- \`url\`: Get the URL of the current page.
`,
    },
    prop: {
      anyOf: [
        { type: 'string' },
        { type: 'integer' },
        { type: 'array', minItems: 1, items: { anyOf: [{ type: 'string' }, { type: 'integer' }] } },
      ],
      description: 'Get a property from an object.',
    },
    'random.choice': {
      enum: [null],
      description:
        'Pick and return a random entry from an array. If the input is not an array, the input is returned as-is.',
    },
    'random.integer': {
      type: 'array',
      maxItems: 2,
      minItems: 2,
      items: {
        type: 'integer',
      },
      description:
        'Pick and return a random integer between the provided lowest and highest values.',
    },
    'random.float': {
      type: 'array',
      maxItems: 2,
      minItems: 2,
      items: {
        type: 'number',
      },
      description:
        'Pick and return a random number between the provided lowest and highest values.',
    },
    'random.string': {
      type: 'object',
      required: ['choice', 'length'],
      additionalProperties: false,
      properties: {
        choice: { type: 'string', minLength: 1 },
        length: { type: 'integer', minimum: 1 },
      },
      description:
        'Pick and return a random string from a given length using characters from a given input string.',
    },
    root: {
      enum: [null],
      description: 'Get the input data as it was initially passed to the remap function.',
    },
    history: {
      type: 'integer',
      description: `Get the data at a certain index from the history stack prior to an action.

0 is the index of the first item in the history stack.`,
    },
    'from.history': {
      type: 'object',
      required: ['index', 'props'],
      description: 'Create a new object with properties from the history stack at a certain index.',
      additionalProperties: false,
      properties: {
        index: {
          type: 'integer',
          description: `The index of the history stack item to assign.

0 is the index of the first item in the history stack.
`,
        },
        props: {
          description: 'Predefined mapper keys to choose what properties to apply.',
          additionalProperties: {
            $ref: '#/components/schemas/RemapperDefinition',
          },
        },
      },
    },
    'assign.history': {
      type: 'object',
      required: ['index', 'props'],
      description:
        'Assign properties from the history stack at a certain index to an existing object.',
      additionalProperties: false,
      properties: {
        index: {
          type: 'integer',
          description: `The index of the history stack item to assign.

0 is the index of the first item in the history stack.
`,
        },
        props: {
          description: 'Predefined mapper keys to choose what properties to assign.',
          additionalProperties: {
            $ref: '#/components/schemas/RemapperDefinition',
          },
        },
      },
    },
    'omit.history': {
      type: 'object',
      required: ['index', 'keys'],
      description:
        'Assign properties from the history stack at a certain index and exclude the unwanted properties.',
      additionalProperties: false,
      properties: {
        index: {
          type: 'integer',
          description: `The index of the history stack item to assign.

0 is the index of the first item in the history stack.
`,
        },
        keys: {
          description: `Exclude properties from the history stack item, based on the given object keys.

Nested properties can be excluded using arrays of keys.

For example:
\`\`\`yaml
omit.history:
  index: 0
  keys:
    - foo   # Excludes the property foo
    - - bar # Excludes the property baz inside of bar
      - baz
\`\`\`
`,
          type: 'array',
          items: {
            minItems: 1,
            anyOf: [
              { type: 'string' },
              {
                type: 'array',
                minItems: 2,
                items: {
                  type: 'string',
                },
              },
            ],
          },
        },
      },
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
