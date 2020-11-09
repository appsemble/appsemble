import { api } from '@appsemble/utils';
import { OpenAPIV3 } from 'openapi-types';

import { oauth2Scope } from './constants';

describe('oauth2Scope', () => {
  it('should match the allowed scopes in the API', () => {
    const openApiDocument = api('');
    const scheme = openApiDocument.components.securitySchemes.app as OpenAPIV3.OAuth2SecurityScheme;
    const allowedScopes = Object.keys(scheme.flows.authorizationCode.scopes).sort().join(' ');
    expect(oauth2Scope).toBe(allowedScopes);
  });
});
