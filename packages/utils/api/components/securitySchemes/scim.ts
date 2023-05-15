import { type OpenAPIV3 } from 'openapi-types';

export const scim: OpenAPIV3.HttpSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  description: 'Used SCIM clients',
};
