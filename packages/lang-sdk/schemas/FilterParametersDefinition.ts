import { type OpenAPIV3 } from 'openapi-types';

export const FilterParametersDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description:
    'An object describing the comparison that should be applied to the key in an OData filter.',
  additionalProperties: false,
  properties: {
    type: {
      enum: ['Boolean', 'String', 'Number', 'Date', 'Guid'],
    },
    value: { $ref: '#/components/schemas/RemapperDefinition' },
    comparator: {
      enum: ['eq', 'ge', 'gt', 'le', 'lt', 'ne'],
    },
  },
};
