import { type OpenAPIV3 } from 'openapi-types';

export const stringRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'string.case': {
    enum: ['lower', 'upper'],
    description: `Convert a string to upper or lower case.
\`\`\`yaml
string.case: upper
\`\`\`

Result:

\`\`\`json
"PATRICK"
\`\`\`

`,
  },
  'string.format': {
    type: 'object',
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
    description: `Format a string using remapped input variables.
Useful for replacing static text with generated values.

\`\`\`yaml
string.format:
  template: 'You have won €{lotteryAmount} in the lottery!!'
  values:
    lotteryAmount: { prop: lotteryPrize }
\`\`\`

Result:

\`\`\`json
"You have won €5000 in the lottery!!"
\`\`\`

> **Tip:** Considering this can be inserted anywhere a remapper is accepted. You can also use this
> to choose specific URL’s more accurately.

`,
  },
  'string.replace': {
    type: 'object',
    minProperties: 1,
    maxProperties: 1,
    additionalProperties: {
      type: 'string',
    },
    description: `
Uses RegEx to find a value in a string and replace it with a given value.

\`\`\`yaml
# Input: Eindhoven is the best city in the Netherlands
string.replace:
  (beszt*)\\w+: cleanest
\`\`\`

Result:

\`\`\`json
"Eindhoven is the cleanest city in the Netherlands"
\`\`\`
`,
  },
};
