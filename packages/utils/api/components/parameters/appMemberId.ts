import { type OpenAPIV3 } from 'openapi-types';

export const appMemberId: OpenAPIV3.ParameterObject = {
  name: 'memberId',
  in: 'path',
  description: 'The id of the app member on which to perform an operation',
  required: true,
  schema: { $ref: '#/components/schemas/AppMember/properties/id' },
};
