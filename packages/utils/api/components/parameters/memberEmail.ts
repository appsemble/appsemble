import { type OpenAPIV3 } from 'openapi-types';

export const memberEmail: OpenAPIV3.ParameterObject = {
  name: 'memberEmail',
  in: 'path',
  description: 'The email of the member on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/Member/properties/primaryEmail' },
};
