import { OpenAPIV3 } from 'openapi-types';

export const studio: OpenAPIV3.HttpSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'jwt',
  description: 'Used for authenticating requests made using Appsemble studio interface.',
};
