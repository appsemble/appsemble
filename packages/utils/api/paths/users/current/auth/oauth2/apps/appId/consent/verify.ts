import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    description: 'Verify if the user has previously agreed to the requested OAuth2 consent.',
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2'],
    operationId: 'verifyCurrentUserOAuth2AppConsent',
    requestBody: { $ref: '#/components/requestBodies/oauth2Consent' },
    responses: { 200: { $ref: '#/components/responses/oauth2AuthorizationCode' } },
    security: [{ studio: [] }],
  },
};
