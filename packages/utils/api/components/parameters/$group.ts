import { type OpenAPIV3 } from 'openapi-types';

export const $group: OpenAPIV3.ParameterObject = {
  name: '$group',
  in: 'query',
  description:
    'A custom filter for filtering the query by groups the requesting user is a member of.',
  schema: { enum: ['member'] },
};
