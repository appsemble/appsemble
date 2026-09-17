import { randomUUID } from 'node:crypto';

import { throwKoaError } from '@appsemble/node-utils';
import jwt from 'jsonwebtoken';
import { type Context } from 'koa';

import { argv } from './argv.js';

/**
 * How long a pending TOTP token is valid, in seconds.
 *
 * This is the time the app member gets to read a code from their authenticator app, so it’s
 * deliberately short.
 */
const TOTP_PENDING_TOKEN_EXPIRES = 300;

interface Options {
  /**
   * The audience for which the token is intended, i.e. the OAuth2 client id of the app.
   */
  aud: string;

  /**
   * The scope to grant once the second factor has been verified.
   */
  scope?: string;

  /**
   * The id of the app member whose first factor has been verified.
   */
  sub: string;
}

export interface TotpPendingPayload {
  /**
   * The scope to grant once the second factor has been verified.
   */
  scope?: string;

  /**
   * The id of the app member whose first factor has been verified.
   */
  sub: string;
}

/**
 * Create a short lived token which proves the first authentication factor has been verified.
 *
 * The token is not an access token. It only authorizes the TOTP endpoints to act on behalf of the
 * app member, which is what binds the two steps of the login flow together.
 *
 * @param options The options for creating the pending token.
 * @returns A signed JWT to be exchanged for an access token using a valid TOTP token.
 * @see https://www.iana.org/assignments/jwt/jwt.xhtml
 */
export function createTotpPendingToken({ aud, scope, sub }: Options): string {
  const iat = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      // The audience this token is for, i.e. the OAuth2 client id of the app.
      aud,
      exp: iat + TOTP_PENDING_TOKEN_EXPIRES,
      // This token is issued at the current time.
      iat,
      // This token was issued by the Appsemble host.
      iss: argv.host,
      // A unique id for this token, so it can be identified in logs.
      jti: randomUUID(),
      scope,
      // This token can be used to verify the second factor of the app member having this id.
      sub,
      // This token may only be used to verify a TOTP token, not to authenticate requests.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      token_use: 'totp_pending',
    },
    argv.secret,
  );
}

/**
 * Verify a pending TOTP token.
 *
 * @param ctx The Koa context used to throw the error response.
 * @param appId The id of the app the token must belong to.
 * @param token The pending TOTP token to verify.
 * @returns The subject and scope the token was issued for.
 */
export function verifyTotpPendingToken(
  ctx: Context,
  appId: number,
  token: string,
): TotpPendingPayload {
  let payload: jwt.JwtPayload;

  try {
    payload = jwt.verify(token, argv.secret, { audience: `app:${appId}` }) as jwt.JwtPayload;
  } catch {
    throwKoaError(ctx, 401, 'Invalid pending TOTP token');
  }

  if (payload.token_use !== 'totp_pending' || typeof payload.sub !== 'string') {
    throwKoaError(ctx, 401, 'Invalid pending TOTP token');
  }

  return { scope: payload.scope, sub: payload.sub };
}
