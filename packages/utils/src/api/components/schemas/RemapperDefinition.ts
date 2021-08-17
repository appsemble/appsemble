import { OpenAPIV3 } from 'openapi-types';

export const RemapperDefinition: OpenAPIV3.NonArraySchemaObject = {
  anyOf: [
    {
      type: 'boolean',
      description: 'A boolean remapper is always returned directly.',
    },
    {
      enum: [null],
      description: 'A null remapper is always returned directly.',
    },
    {
      type: 'number',
      description: 'A numeric remapper is always returned directly.',
    },
    {
      type: 'string',
      description: 'A string remapper is always returned directly.',
    },
    {
      $ref: '#/components/schemas/ObjectRemapperDefinition',
    },
    {
      type: 'array',
      description: `If a remapper is an array, it represents a chain of remappers.

Each item represents a remapper which is called with the result of the remapper before it.
`,
      items: {
        $ref: '#/components/schemas/ObjectRemapperDefinition',
      },
    },
  ],
};
