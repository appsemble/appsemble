import bcrypt from 'bcrypt';
import { isPast } from 'date-fns';
import querystring from 'querystring';
import raw from 'raw-body';

import { partialNormalized } from '../../../utils/constants/patterns';
import createJWTResponse from '../../utils/createJWTResponse';

class GrantError extends Error {
  constructor(error, status = 400) {
    super(error);
    this.status = status;
  }
}

function checkTokenRequestParameters(query, allowed) {
  Object.entries(query).forEach(([key, value]) => {
    if (allowed.includes(key)) {
      return;
    }
    if (Array.isArray(value)) {
      throw GrantError('invalid_request');
    }
  });
  return query;
}

/**
 * Get an access token for a client.
 *
 * This handler is written to be complaitn with [rfc6749](https://tools.ietf.org/html/rfc6749).
 */
export default async function tokenHandler(ctx) {
  const { argv, header } = ctx;
  const { App, EmailAuthorization, OAuth2ClientCredentials, User } = ctx.db.models;
  let aud;
  let refreshToken;
  let scope;
  let sub;

  try {
    if (!ctx.is('application/x-www-form-urlencoded')) {
      throw new GrantError('invalid_request');
    }
    const { grant_type: grantType, ...query } = querystring.parse(
      await raw(ctx.req, { encoding: 'utf-8' }),
    );

    switch (grantType) {
      case 'client_credentials': {
        const { scope: requestedScope } = checkTokenRequestParameters(query, ['scope']);
        const authorization = /^Basic (.*)$/.exec(header.authorization);
        if (!authorization) {
          throw new GrantError('invalid_client');
        }
        const credentials = `${Buffer.from(authorization[1], 'base64')}`.match(/([^:]*):(.*)/);
        if (!credentials) {
          throw new GrantError('invalid_client');
        }
        const client = await OAuth2ClientCredentials.findOne({
          attributes: ['expires', 'id', 'scopes', 'UserId'],
          raw: true,
          where: {
            id: credentials[1],
            secret: credentials[2],
          },
        });
        if (!client) {
          throw new GrantError('invalid_client');
        }
        if (client.expires && isPast(client.expires)) {
          throw new GrantError('invalid_grant');
        }
        const clientScopes = client.scopes.split(' ');
        if (!requestedScope) {
          throw new GrantError('invalid_scope');
        }
        scope = requestedScope.split(' ').sort();
        if (!scope.every(s => clientScopes.includes(s))) {
          throw new GrantError('invalid_scope');
        }
        aud = client.id;
        sub = client.UserId;
        refreshToken = false;
        break;
      }
      // XXX The password grant type is supported for now for legacy apps.
      case 'password': {
        const { password, scope: requestedScope, username } = checkTokenRequestParameters(query, [
          'password',
          'scope',
          'username',
        ]);

        // Validate the app as a client.
        // XXX use origin check when default app domains are implemented.
        const { pathname } = new URL(header.referer);
        const match = pathname.match(`/@${partialNormalized.source}/${partialNormalized.source}`);
        if (!match) {
          throw new GrantError('invalid_client');
        }
        const app = await App.findOne({
          attributes: ['id'],
          where: { OrganizationId: match[1], path: match[2] },
        });
        if (!app) {
          throw new GrantError('invalid_client');
        }

        // Validate user credentials
        const emailAuth = await EmailAuthorization.findOne({
          include: [User],
          where: { email: username },
        });
        if (!emailAuth) {
          throw new GrantError('invalid_grant');
        }
        const isValidPassword = await bcrypt.compare(password, emailAuth.User.password);
        if (!isValidPassword) {
          throw new GrantError('invalid_grant');
        }

        scope = [requestedScope];
        aud = `app:${app.id}`;
        sub = emailAuth.User.id;
        refreshToken = true;
        break;
      }
      default:
        throw new GrantError('unsupported_grant_type');
    }
  } catch (error) {
    if (error instanceof GrantError) {
      ctx.status = error.status;
      ctx.body = { error: error.message };
      return;
    }
    throw error;
  }

  ctx.body = createJWTResponse(sub, argv, { aud, refreshToken, scope });
}
