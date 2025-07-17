import { type OpenAPIV3 } from 'openapi-types';

import { schemaExample } from '../../examples.js';

export const numberRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'number.parse': {
    anyOf: [
      { enum: [null] },
      { type: 'string' },
      { $ref: '#/components/schemas/ArrayRemapperDefinition' },
      { $ref: '#/components/schemas/ObjectRemapperDefinition' },
    ],
    description: `Convert a string into a number.

If there is no remapper passed and the input can be converted, this will return the converted input.

If there is no remapper passed and the input is null, this will return 0.

If there is no remapper passed and the input cannot be converted, this will return the input.

If there is a remapper passed and the remapped value can be converted, this will return the converted remapped value.

If there is a remapper passed and the remapped value is null, this will return 0.

If there is a remapper passed and the remapped value cannot be converted, this will return the remapped value.

For example:

${schemaExample('number.parse')}
`,
  },
};
