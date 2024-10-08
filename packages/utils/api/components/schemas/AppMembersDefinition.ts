import { type OpenAPIV3 } from 'openapi-types';

export const AppMembersDefinition: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'Definition for app member properties.',
  required: [],
  additionalProperties: false,
  properties: {
    properties: {
      type: 'object',
      description: 'The properties object configuring app members',
      additionalProperties: {
        description: 'A single app member property definition.',
        $ref: '#/components/schemas/AppMemberPropertyDefinition',
      },
    },
  },
};
