import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/auth/email/login': {
    post: {
      tags: ['main', 'auth', 'email'],
      description: 'Login using the Appsemble studio.',
      operationId: 'loginUserWithEmail',
      responses: { 200: { description: 'Logged in successfully.' } },
      security: [{ basic: [] }],
    },
  },
};
