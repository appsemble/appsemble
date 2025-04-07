import { type OpenAPIV3 } from 'openapi-types';

export const JSONSchema: OpenAPIV3.NonArraySchemaObject = {
  anyOf: [
    { $ref: '#/components/schemas/JSONPointer' },
    { $ref: '#/components/schemas/JSONSchemaAnyOf' },
    { $ref: '#/components/schemas/JSONSchemaArray' },
    { $ref: '#/components/schemas/JSONSchemaBoolean' },
    { $ref: '#/components/schemas/JSONSchemaConst' },
    { $ref: '#/components/schemas/JSONSchemaEnum' },
    { $ref: '#/components/schemas/JSONSchemaInteger' },
    { $ref: '#/components/schemas/JSONSchemaMultiType' },
    { $ref: '#/components/schemas/JSONSchemaNot' },
    { $ref: '#/components/schemas/JSONSchemaNull' },
    { $ref: '#/components/schemas/JSONSchemaNumber' },
    { $ref: '#/components/schemas/JSONSchemaObject' },
    { $ref: '#/components/schemas/JSONSchemaOneOf' },
    { $ref: '#/components/schemas/JSONSchemaRemapper' },
    { $ref: '#/components/schemas/JSONSchemaString' },
  ],
};
