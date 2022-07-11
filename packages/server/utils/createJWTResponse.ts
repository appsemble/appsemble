import { TokenResponse } from '@appsemble/types';
import { sign } from 'jsonwebtoken';

import { argv } from './argv';

interface Options {
  /**
   * The audience for which the token is intended, such as an OAuth2 client id. This defaults to the
   * host variable.
   */
  aud?: string;

  /**
   * In how much time the token will expire, in seconds.
   */
  expires?: number;

  /**
   * If explicitly set to `false`, not refresh token will be generated.
   */
  refreshToken?: boolean;

  /**
   * The scope to set on the access token and refresh token.
   */
  scope?: string;
}

/**
 * Create a JSON web token response.
 *
 * @param sub The id of the user that is authenticated using the token.
 * @param options The options for creating the JWS response.
 * @returns A JWT based OAuth2 response body.
 * @see https://www.iana.org/assignments/jwt/jwt.xhtml
 */
export function createJWTResponse(
  sub: string,
  { aud = argv.host, expires = 3600, refreshToken = true, scope }: Options = {},
): TokenResponse {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    // The audience this token is for, i.e. the web platform host or an OAuth2 client id.
    aud,
    // This token is issued at the current time.
    iat,
    // This token was issued by the Appsemble host.
    iss: argv.host,
    scope,
    // This token can be used to authenticate the user having this id.
    sub,
  };
  const response: TokenResponse = {
    // The access token token expires in an hour.
    access_token: sign({ ...payload, exp: iat + expires }, argv.secret),
    expires_in: expires,
    token_type: 'bearer',
  };
  if (refreshToken) {
    // The refresh token token expires in a month.
    response.refresh_token = sign({ ...payload, exp: iat + 60 * 60 * 24 * 30 }, argv.secret);
  }
  return response;
}
