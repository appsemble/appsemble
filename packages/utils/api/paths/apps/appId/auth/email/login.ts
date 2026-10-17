import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  post: {
    tags: ['app', 'auth', 'email'],
    description: 'Login using the Appsemble studio.',
    operationId: 'loginAppMemberWithEmail',
    responses: { 200: { description: 'Logged in successfully.' } },
    security: [{ basic: [] }],
  },
};
