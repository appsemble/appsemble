import { OpenAPIV3 } from 'openapi-types';

import { roles } from '.';

export const ResourceViewDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  minProperties: 1,
  description:
    'Alternative views of a resource that are modified using remappers and support different sets of roles.',
  additionalProperties: {
    type: 'object',
    additionalProperties: false,
    description: 'A custom view for a resource.',
    properties: {
      roles,
      remap: {
        $ref: '#/components/schemas/RemapperDefinition',
        description: 'The modified view.',
      },
    },
  },
};
