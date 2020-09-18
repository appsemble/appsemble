import type { OpenAPIV3 } from 'openapi-types';

export const $top: OpenAPIV3.ParameterObject = {
  name: '$top',
  in: 'query',
  description: 'Limit the number of entities returned.',
  // XXX This doesn’t work due to an upstream bug in Koas.
  // schema: { type: 'integer' },
};
