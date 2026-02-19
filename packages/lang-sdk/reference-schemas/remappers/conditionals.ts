import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const conditionalRemappers: Record<
  string,
  OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
> = {
  if: {
    type: 'object',
    description: `Check if condition results in a truthy value.

Returns value of \`then\` if condition is truthy, otherwise it returns the value of \`else\`.

For example:

${schemaExample('if.then')}

${schemaExample('if.else', { exclude: ['remapper'] })}
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

${schemaExample('equals')}
`,
  },
  gt: {
    type: 'array',
    description: `**(gt = Greater than)**

Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is greater than the second entry.

For example, if \`stock\` is more than 5 here, it returns \`true\`.

${schemaExample('gt')}
`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  gte: {
    type: 'array',
    description: `**(gte = Greater than or equal)**

Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is greater than or equal to the second entry.

For example, if \`stock\` is 5 or more here, it returns \`true\`.

${schemaExample('gte')}
`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  lt: {
    type: 'array',
    description: `**(lt = Less than)**

Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is less than the second entry.

For example, if \`stock\` is less than 5 here, it returns \`true\`.

${schemaExample('lt')}
`,
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
  },
  lte: {
    type: 'array',
    description: `**(lte = Less than or equal)**

Compare the first computed remapper value with the second computed remapper value.

Returns \`true\` if the first entry is less than or equal to the second entry.

For example, if \`stock\` is 5 or less here, it returns \`true\`.

${schemaExample('lte')}
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

${schemaExample('not')}
`,
  },
  match: {
    type: 'array',
    description: `Check if any case results in a truthy value.

Returns the value of the first case where the condition equals true, otherwise returns null.

In the following example, let's say the \`Gem\` is a "Ruby". The match remapper then returns
\`value: 75\`.

${schemaExample('match')}
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
  and: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `Compare all computed remapper values against each other.

Returns \`true\` if all entries are equal to \`true\`, otherwise \`false\`.

If only one remapper or none is passed, the remapper value gets computed.

${schemaExample('and')}
`,
  },
  or: {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `Compare all computed remapper values against each other.

Returns \`false\` if all entries are equal to \`false\`, otherwise \`true\`.

If only one remapper or none is passed, the remapper value gets computed.

${schemaExample('or')}
`,
  },
  defined: {
    $ref: '#/components/schemas/RemapperDefinition',
    description: `Check if a value is defined. Returns \`true\` if defined, \`false\` if not.

Considers falsy values like \`0\`, \`""\` and \`false\` as defined.

The \`null\` and \`undefined\` values are considered as not defined.

${schemaExample('defined')}
`,
  },
};
