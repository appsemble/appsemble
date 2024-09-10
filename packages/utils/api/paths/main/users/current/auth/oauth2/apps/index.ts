import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/main/users/current/auth/oauth2/apps/{appId}/consent/agree': {
    post: {
      description: 'Create a new OAuth2 consent.',
      tags: ['main', 'user', 'current-user', 'auth', 'oauth2'],
      operationId: 'agreeCurrentUserOAuth2AppConsent',
      requestBody: { $ref: '#/components/requestBodies/oauth2Consent' },
      responses: { 201: { $ref: '#/components/responses/oauth2AuthorizationCode' } },
      security: [{ studio: [] }],
    },
  },
  '/api/main/users/current/auth/oauth2/apps/{appId}/consent/verify': {
    post: {
      description: 'Verify if the user has previously agreed to the requested OAuth2 consent.',
      tags: ['main', 'user', 'current-user', 'auth', 'oauth2'],
      operationId: 'verifyCurrentUserOAuth2AppConsent',
      requestBody: { $ref: '#/components/requestBodies/oauth2Consent' },
      responses: { 200: { $ref: '#/components/responses/oauth2AuthorizationCode' } },
      security: [{ studio: [] }],
    },
  },
};
