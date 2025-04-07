import { type OpenAPIV3 } from 'openapi-types';

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
      $ref: '#/components/schemas/ArrayRemapperDefinition',
    },
  ],
};
