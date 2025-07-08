import { type OpenAPIV3 } from 'openapi-types';

import * as remapperSchemas from '../reference-schemas/remappers/index.js';

const remapperList = {};

for (const section of Object.values(remapperSchemas)) {
  Object.assign(remapperList, section);
}

export const ObjectRemapperDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: `An object based remapper is defined by a specific implementation

Object based remappers may only define 1 key. The allowed value depends on the remapper.
`,
  minProperties: 1,
  maxProperties: 1,
  additionalProperties: false,
  properties: remapperList,
};
