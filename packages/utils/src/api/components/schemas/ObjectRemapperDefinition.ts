import { OpenAPIV3 } from 'openapi-types';

export const ObjectRemapperDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `An object based remapper is defined by a specific implementation

Object based remappers may only define 1 key. The allowed value depends on the remapper.
`,
  maxProperties: 1,
  additionalProperties: true,
};
