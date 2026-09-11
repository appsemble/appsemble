import { type OpenAPIV3 } from 'openapi-types';

export const selectedGroupId: OpenAPIV3.ParameterObject = {
  name: 'selectedGroupId',
  in: 'query',
  description:
    'The selected groups of the app member to scope the request to. Accepts a single value ' +
    '(`selectedGroupId=1`) or several (`selectedGroupId=1&selectedGroupId=2`). Pass -1 for the ' +
    'app-wide scope.',
  style: 'form',
  explode: true,
  schema: { type: 'array', items: { type: 'number' } },
};
