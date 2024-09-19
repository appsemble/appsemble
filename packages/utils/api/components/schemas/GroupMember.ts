import { type OpenAPIV3 } from 'openapi-types';

export const GroupMember: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An object representing a member of a group',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      readOnly: true,
      description: 'The id of the app member.',
    },
    role: {
      type: 'string',
      description: 'The role of the app member within the group.',
    },
    name: { $ref: '#/components/schemas/AppMember/properties/name' },
    email: { $ref: '#/components/schemas/AppMember/properties/email' },
  },
};
