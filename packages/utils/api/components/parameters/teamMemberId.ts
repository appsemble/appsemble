import { type OpenAPIV3 } from 'openapi-types';

export const teamMemberId: OpenAPIV3.ParameterObject = {
  name: 'teamMemberId',
  in: 'path',
  description: 'The id of the team member on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/AppMember/properties/id' },
};
