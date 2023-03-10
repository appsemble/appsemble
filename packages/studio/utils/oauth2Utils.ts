import { getOneSearchParam } from '@appsemble/web-utils';

export function oauth2Redirect(qs: URLSearchParams, params: Record<string, string>): void {
  const redirectUri = new URL(getOneSearchParam(qs, 'redirect_uri'));
  const state = getOneSearchParam(qs, 'state');

  redirectUri.hash = '';
  redirectUri.search = '';
  for (const [key, value] of Object.entries(params)) {
    redirectUri.searchParams.set(key, value);
  }
  if (state) {
    redirectUri.searchParams.set('state', state);
  }
  window.location.assign(String(redirectUri));
}

/**
 * Verify if the query parameters of the authorization request are value.
 *
 * If the query parameters are invalid, the user is redirected back to the redirect URI as specified
 * in [RFC 6749](https://tools.ietf.org/html/rfc6749#section-4.1.2.1).
 *
 * It verifies that:
 * - No required parameters are missing.
 * - No duplicate parameters are present.
 * - The response type is valid.
 * - The scope is valid.
 *
 * @param qs The query parameters to check.
 * @param allowedScopes Scopes the client is allowed to request.
 * @returns `true` is validation passes. Otherwise `false`, and the user will be redirected to the
 * redirect URL.
 * @throws If the `redirect_uri` paremter is missing or malformed.
 */
export function verifyOAuth2LoginRequest(qs: URLSearchParams, allowedScopes: string[]): boolean {
  const clientId = getOneSearchParam(qs, 'client_id');
  const responseType = getOneSearchParam(qs, 'response_type');
  const scope = getOneSearchParam(qs, 'scope');
  const state = getOneSearchParam(qs, 'state');

  if (responseType == null || clientId == null || scope == null || state == null) {
    oauth2Redirect(qs, { error: 'invalid_request' });
    return false;
  }
  if (responseType !== 'code') {
    oauth2Redirect(qs, { error: 'unsupported_response_type' });
    return false;
  }
  if (scope.split(' ').some((s) => !allowedScopes.includes(s))) {
    oauth2Redirect(qs, { error: 'invalid_scope' });
    return false;
  }
  return true;
}
