import { OpenAPIV3 } from 'openapi-types';

import { TeamRole } from '../../../constants';

export const $team: OpenAPIV3.ParameterObject = {
  name: '$team',
  in: 'query',
  description:
    'A custom filter for filtering the query by teams the requesting user is a member of.',
  schema: { type: 'string', enum: Object.values(TeamRole) },
};
