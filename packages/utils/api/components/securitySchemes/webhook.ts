import { type OpenAPIV3 } from 'openapi-types';

export const webhook: OpenAPIV3.HttpSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  description: 'Used for webhook calls',
};
