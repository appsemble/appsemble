import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'saml'],
    operationId: 'continueSamlLogin',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: { id: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Continue SAML login in case of an email conflict',
        content: {
          'application/jso': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: { redirect: { type: 'string' } },
            },
          },
        },
      },
    },
    security: [{ studio: [] }, {}],
  },
};
