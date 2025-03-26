import querystring from 'node:querystring';

import { compare } from 'bcrypt';
import { isPast } from 'date-fns';
import { type Context } from 'koa';
import raw from 'raw-body';

import { OAuth2ClientCredentials } from '../../models/index.js';
import { createJWTResponse } from '../../utils/createJWTResponse.js';
import { checkTokenRequestParameters, GrantError, hasScope } from '../../utils/oauth2.js';

/**
 * Get an access token for a client.
 *
 * This handler is written to be compliant with [rfc6749](https://tools.ietf.org/html/rfc6749).
 *
 * @param ctx The Koa context.
 */
export async function mainTokenHandler(ctx: Context): Promise<void> {
  const { header } = ctx;
  let aud: string;
  let refreshToken: boolean;
  let scope: string;
  let sub: string;

  try {
    if (!ctx.is('application/x-www-form-urlencoded')) {
      throw new GrantError('invalid_request');
    }
    const { grant_type: grantType, ...query } = querystring.parse(
      await raw(ctx.req, { encoding: 'utf8' }),
    );

    switch (grantType) {
      case 'client_credentials': {
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks)
        const { scope: requestedScope } = checkTokenRequestParameters(query, ['scope']);
        const authorization = /^Basic (.*)$/.exec(header.authorization ?? '');
        if (!authorization) {
          throw new GrantError('invalid_client');
        }
        const credentials = String(Buffer.from(authorization[1], 'base64')).match(/([^:]*):(.*)/);
        if (!credentials) {
          throw new GrantError('invalid_client');
        }
        const [, id, secret] = credentials;
        const client = await OAuth2ClientCredentials.findOne({
          attributes: ['expires', 'id', 'scopes', 'secret', 'UserId'],
          where: { id },
        });
        if (!client) {
          throw new GrantError('invalid_client');
        }
        if (!(await compare(secret, client.secret))) {
          throw new GrantError('invalid_client');
        }
        if (!client) {
          throw new GrantError('invalid_client');
        }
        if (client.expires && isPast(client.expires)) {
          throw new GrantError('invalid_grant');
        }
        if (!hasScope(client.scopes, requestedScope || '')) {
          throw new GrantError('invalid_scope');
        }
        aud = id;
        refreshToken = false;
        scope = requestedScope;
        sub = client.UserId;
        break;
      }
      default:
        throw new GrantError('unsupported_grant_type');
    }
  } catch (error: unknown) {
    if (error instanceof GrantError) {
      ctx.status = error.status;
      ctx.body = { error: error.message };
      return;
    }
    throw error;
  }

  ctx.body = createJWTResponse(sub, { aud, refreshToken, scope });
}
