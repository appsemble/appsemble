import { sign } from 'jsonwebtoken';

/**
 * Create a JSON web token response.
 *
 * @see https://www.iana.org/assignments/jwt/jwt.xhtml
 *
 * @param sub The id of the user that is authenticated using the token.
 * @param argv CLI arguments passed to the server.
 * @param argv.host The URL on which Appsemble is hosted. This is used for both the JWT audience and
 *   the JWT issuer.
 * @param argv.secret The secret that is used to sign the token.
 * @param options
 * @param options.aud The audience for which the token is intended, such as an OAuth2 client id.
 *   This defaults to the host variable.
 * @param options.expires In how much time the token will expire, in seconds.
 * @param options.refreshToken If explicitly set to `false`, not refresh token will be generated.
 */
export default function createJWTResponse(
  sub,
  { host, secret },
  { aud = host, expires = 3600, refreshToken = true, scope } = {},
) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    // The audience this token is for, i.e. the web platform host or an OAuth2 client id.
    aud,
    // This token is issued at the current time.
    iat,
    // This token was issued by the Appsemble host.
    iss: host,
    scope,
    // This token can be used to authenticate the user having this id.
    sub,
  };
  const response = {
    // The access token token expires in an hour.
    access_token: sign({ ...payload, exp: iat + expires }, secret),
    expires_in: expires,
    token_type: 'bearer',
  };
  if (refreshToken) {
    // The refresh token token expires in a month.
    response.refresh_token = sign({ ...payload, exp: iat + 60 * 60 * 24 * 30 }, secret);
  }
  return response;
}
