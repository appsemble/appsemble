import { type OpenAPIV3 } from 'openapi-types';

export const groupMemberId: OpenAPIV3.ParameterObject = {
  name: 'groupMemberId',
  in: 'path',
  description: 'The id of the group member on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/AppMember/properties/id' },
};
