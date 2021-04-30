import { OpenAPIV3 } from 'openapi-types';

export const RemapperDefinition: OpenAPIV3.NonArraySchemaObject = {
  oneOf: [
    {
      type: 'boolean',
      description: 'A boolean remapper is always returned directly.',
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
      type: 'object',
      description: `An object based remapper is defined by a specific implementation

Object based remappers may only define 1 key. The allowed value depends on the remapper.
`,
      maxProperties: 1,
      additionalProperties: {
        type: 'object',
      },
    },
  ],
};
