import { type OpenAPIV3 } from 'openapi-types';

export const ResourceHistoryDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  additionalProperties: false,
  description: 'A definition of how versioning works for instances of this resource',
  required: ['data'],
  properties: {
    data: {
      type: 'boolean',
      default: true,
      description: 'If set to `false`, edits are still tracked, but exactly what changed is lost.',
    },
  },
};
