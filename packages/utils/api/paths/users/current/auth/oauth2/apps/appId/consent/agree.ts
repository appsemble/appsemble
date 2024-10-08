import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    description: 'Create a new OAuth2 consent.',
    tags: ['main', 'user', 'current-user', 'auth', 'oauth2'],
    operationId: 'agreeCurrentUserOAuth2AppConsent',
    requestBody: { $ref: '#/components/requestBodies/oauth2Consent' },
    responses: { 201: { $ref: '#/components/responses/oauth2AuthorizationCode' } },
    security: [{ studio: [] }],
  },
};
