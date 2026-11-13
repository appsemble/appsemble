import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'auth'],
    operationId: 'logout',
    description: 'Revoke the current organization SSO session.',
    security: [{ studio: [] }],
    responses: { 204: { description: 'The current session has been revoked.' } },
  },
};
