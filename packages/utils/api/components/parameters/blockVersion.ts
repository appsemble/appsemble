import { type OpenAPIV3 } from 'openapi-types';

export const blockVersion: OpenAPIV3.ParameterObject = {
  name: 'blockVersion',
  in: 'path',
  description: 'The version of the block on which to perform an operation.',
  required: true,
  schema: { $ref: '#/components/schemas/BlockVersion/properties/version' },
};
