import { OpenAPIV3 } from 'openapi-types';

export const organizationId: OpenAPIV3.ParameterObject = {
  name: 'organizationId',
  in: 'path',
  description: 'The ID of the organization on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/Organization/properties/id' },
};
