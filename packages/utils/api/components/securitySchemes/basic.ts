import { OpenAPIV3 } from 'openapi-types';

export const basic: OpenAPIV3.HttpSecurityScheme = {
  type: 'http',
  scheme: 'basic',
  description: 'Used for logging in to the web interface',
};
