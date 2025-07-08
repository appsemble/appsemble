import { type OpenAPIV3 } from 'openapi-types';

export const ArrayRemapperDefinition: OpenAPIV3.ArraySchemaObject = {
  type: 'array',
  description: `If a remapper is an array, it represents a chain of remappers.

Each item represents a remapper which is called with the result of the remapper before it.

If an array is nested, it will be flattened. This allows you to create reusable remappers and
reference them using YAML anchors.
`,
  minItems: 1,
  items: {
    anyOf: [
      {
        $ref: '#/components/schemas/ObjectRemapperDefinition',
      },
      {
        $ref: '#/components/schemas/ArrayRemapperDefinition',
      },
    ],
  },
};
