import { type OpenAPIV3 } from 'openapi-types';

export const seed: OpenAPIV3.ParameterObject = {
  name: 'seed',
  in: 'query',
  description: `
    Whether the resources or assets are seed instead.
    `,
  schema: { type: 'string' },
};
