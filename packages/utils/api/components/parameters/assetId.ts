import { OpenAPIV3 } from 'openapi-types';

export const assetId: OpenAPIV3.ParameterObject = {
  name: 'assetId',
  in: 'path',
  description: 'The ID of the asset on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/Asset/properties/id' },
};
