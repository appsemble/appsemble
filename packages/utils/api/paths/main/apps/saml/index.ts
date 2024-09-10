import { type OpenAPIV3 } from 'openapi-types';

import { paths as acsPaths } from './acs.js';
import { paths as metadataPaths } from './metadata.js';

export const paths: OpenAPIV3.PathsObject = {
  ...acsPaths,
  ...metadataPaths,
  '/api/apps/{appId}/saml/{appSamlSecretId}/authn': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/appSamlSecretId' },
    ],
    post: {
      tags: ['main', 'app', 'saml'],
      operationId: 'createAppSamlAuthnRequest',
      security: [{ studio: [] }, {}],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                redirectUri: { type: 'string' },
                scope: { type: 'string' },
                state: { type: 'string' },
                timezone: { enum: Intl.supportedValuesOf('timeZone') },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'A list of the SAML secrets for the app.',
          content: {
            'application/json': {
              schema: {},
            },
          },
        },
      },
    },
  },
};
