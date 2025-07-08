import { type OpenAPIV3 } from 'openapi-types';

export const randomRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'random.choice': {
    enum: [null],
    description: `Pick and return a random entry from an array. If the input is not an array, the input is returned as-is.
For example:

If you input the following array:
\`\`\`json
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
\`\`\`

\`\`\`yaml
random.choice: null
\`\`\`

The result could return any one of these numbers.

You can also combine different data types in this array and have it work in the same way. If mixed in
strings, the result could be either one of the provided numbers or one of the provided strings.

\`\`\`json
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Peter", "Patrick", "Michael", "Harry"]
\`\`\`
`,
  },
  'random.integer': {
    type: 'array',
    maxItems: 2,
    minItems: 2,
    items: {
      type: 'integer',
    },
    description: `Pick and return a random integer between the provided lowest and highest values.
For example:
\`\`\`yaml
random.integer:
  - 0
  - 1000
\`\`\`

Returns a random integer between 0 and 1000.
`,
  },
  'random.float': {
    type: 'array',
    maxItems: 2,
    minItems: 2,
    items: {
      type: 'number',
    },
    description: `Pick and return a random float value between the provided lowest and highest values.
For example:
\`\`\`yaml
random.float:
  - 0
  - 1
\`\`\`

Returns a random float value between 0 and 1.
`,
  },
  'random.string': {
    type: 'object',
    required: ['choice', 'length'],
    additionalProperties: false,
    properties: {
      choice: { type: 'string', minLength: 1 },
      length: { type: 'integer', minimum: 1 },
    },
    description: `Pick and return a random string from a given length using characters from a given input string defined in \`choice\`.
For example:
\`\`\`yaml
random.string:
  choice: abcdefghijklmnopqrstuvwxyz0123456789
  length: 6
\`\`\`

Returns a randomized string that is 6 characters long and consists of any characters in the \`choice\` field, like: \`g8ajss9\`.
`,
  },
};
