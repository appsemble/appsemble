import { type OpenAPIV3 } from 'openapi-types';

export const conditionalRemappers: Record<
  string,
  OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
> = {
  if: {
    type: 'object',
    description: `Check if condition results in a truthy value.

Returns value of \`then\` if condition is truthy, otherwise it returns the value of \`else\`.

For example:

\`\`\`yaml
if:
  condition: { equals: [{ prop: inputValue }, 4] }
  then:
    static: You guessed right!
  else:
    static: You guessed wrong!
\`\`\`

If the \`inputValue\` is \`4\`, it goes to the \`then\` remapper and returns:
\`\`\`
You guessed right!
\`\`\`

If the \`inputValue\` is something other than \`4\`, it goes to the \`else\` remapper and returns:
\`\`\`
You guessed wrong!
\`\`\`
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
  equals: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `Compare all computed remapper values against each other.

Returns \`true\` if all entries are equal, otherwise \`false\`.

In the following example, if the \`inputValue\` and \`expectedValue\` are of the same value, the
condition will return \`true\` and the \`then\` remapper will fire.

\`\`\`yaml
condition:
  equals:
    - prop: inputValue
    - prop: expectedValue
\`\`\`
`,
  },
  gt: {
    type: 'array',
    description: `**(gt = Greater than)**

Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is greater than the second entry.

For example, if \`stock\` is more than 5 here, it returns \`true\`.

\`\`\`yaml
condition:
  gt:
    - prop: stock
    - 5
\`\`\`
`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  lt: {
    type: 'array',
    description: `**(lt = Lesser than)

Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is lesser than the second entry.

For example, if \`stock\` is less than 5 here, it returns \`true\`.

\`\`\`yaml
condition:
  lt:
    - prop: stock
    - 5
\`\`\`
`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  not: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `Compare all computed remapper values against the first.

Returns \`false\` if all entries are equal to the first entry, otherwise \`true\`.

If only one remapper or none is passed, the remapper value gets computed and then inverted.

If \`number\` in the following example is something other than 4, the condition returns \`true\`.

\`\`\`yaml
condition:
  not:
    - prop: number
    - 4
\`\`\`
`,
  },
  match: {
    type: 'array',
    description: `Check if any case results in a truthy value.

Returns the value of the first case where the condition equals true, otherwise returns null.

In the following example, let's say the \`Gem\` is a "Ruby". The match remapper then returns
\`value: 75\`.

\`\`\`yaml
match:
  - case: { equals: [{ prop: Gem }, Diamond] }
    value: 100
  - case: { equals: [{ prop: Gem }, Ruby] }
    value: 75
  - case: { equals: [{ prop: Gem }, Gold] }
    value: 50
  - case: { equals: [{ prop: Gem }, Sapphire] }
    value: 25
\`\`\`
`,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['case', 'value'],
      description: '',
      properties: {
        case: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'The condition to check.',
        },
        value: {
          $ref: '#/components/schemas/RemapperDefinition',
          description: 'This remapper is used if the case is true',
        },
      },
    },
  },
};
