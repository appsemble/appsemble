import querystring from 'node:querystring';

import { logger } from '@appsemble/node-utils';
import { compare } from 'bcrypt';
import { isPast } from 'date-fns';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Context } from 'koa';
import raw from 'raw-body';

import {
  App,
  AppMember,
  OAuth2AuthorizationCode,
  OAuth2ClientCredentials,
  transactional,
} from '../../models/index.js';
import { argv } from '../../utils/argv.js';
import { createJWTResponse } from '../../utils/createJWTResponse.js';
import { hasScope } from '../../utils/oauth2.js';

class GrantError extends Error {
  status: number;

  constructor(
    error:
      | 'invalid_client'
      | 'invalid_grant'
      | 'invalid_request'
      | 'invalid_scope'
      | 'unsupported_grant_type',
    status = 400,
  ) {
    super(error);
    this.status = status;
    this.name = 'GrantError';
  }
}

function checkTokenRequestParameters(
  query: Record<string, string[] | string>,
  allowed: string[],
): Record<string, string> {
  for (const [key, value] of Object.entries(query)) {
    if (allowed.includes(key)) {
      continue;
    }
    if (Array.isArray(value)) {
      throw new GrantError('invalid_request');
    }
  }
  return query as Record<string, string>;
}

/**
 * Get an access token for a client.
 *
 * This handler is written to be compliant with [rfc6749](https://tools.ietf.org/html/rfc6749).
 *
 * @param ctx The Koa context.
 */
export async function appsTokenHandler(ctx: Context): Promise<void> {
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
      case 'authorization_code': {
        const {
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          scope: requestedScope,
        } = checkTokenRequestParameters(query, ['client_id', 'code', 'redirect_uri', 'scope']);
        try {
          const referer = new URL(header.referer);
          const redirect = new URL(redirectUri);
          if (referer.origin !== redirect.origin) {
            throw new GrantError('invalid_request');
          }
        } catch {
          throw new GrantError('invalid_request');
        }
        const match = clientId.match(/^app:(\d+)/);
        if (!match) {
          throw new GrantError('invalid_client');
        }
        const authorizationCode = await OAuth2AuthorizationCode.findOne({
          attributes: ['expires', 'scope', 'AppMemberId'],
          where: { code, AppId: match[1], redirectUri },
        });
        if (!authorizationCode) {
          throw new GrantError('invalid_client');
        }
        await OAuth2AuthorizationCode.destroy({
          where: { code },
        });
        if (isPast(authorizationCode.expires)) {
          throw new GrantError('invalid_grant');
        }
        if (!hasScope(authorizationCode.scope || '', requestedScope || '')) {
          throw new GrantError('invalid_scope');
        }
        aud = clientId;
        refreshToken = true;
        scope = requestedScope;
        sub = authorizationCode.AppMemberId;
        break;
      }
      case 'client_credentials': {
        const { scope: requestedScope } = checkTokenRequestParameters(query, ['scope']);
        const authorization = /^Basic (.*)$/.exec(header.authorization);
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
      case 'refresh_token': {
        const { refresh_token: token } = checkTokenRequestParameters(query, ['refresh_token']);
        try {
          const payload = jwt.verify(token, argv.secret) as JwtPayload;
          ({ scope, sub } = payload);
          aud = payload.aud as string;
          refreshToken = true;
        } catch {
          throw new GrantError('invalid_grant');
        }
        break;
      }
      case 'password': {
        const {
          client_id: clientId,
          password,
          scope: requestedScope,
          username,
        } = checkTokenRequestParameters(query, ['client_id', 'username', 'password', 'scope']);
        const appId = Number(clientId.replace('app:', ''));
        const appMember = await AppMember.findOne({
          where: { AppId: appId, email: username.toLowerCase() },
          attributes: ['id', 'password'],
        });

        if (!appMember?.password || !(await compare(password, appMember.password))) {
          throw new GrantError('invalid_client');
        }

        aud = clientId;
        sub = appMember.id;
        scope = requestedScope;
        refreshToken = true;
        break;
      }
      case 'urn:ietf:params:oauth:grant-type:demo-login': {
        const {
          appMemberId,
          appRole,
          client_id: clientId,
          scope: requestedScope,
        } = checkTokenRequestParameters(query, ['client_id', 'role', 'scope', 'refresh_token']);

        const appId = Number(clientId.replace('app:', ''));
        const app = await App.findByPk(appId, {
          attributes: ['demoMode', 'definition', 'OrganizationId'],
          include: [
            {
              model: AppMember,
              where: {
                demo: true,
              },
              required: false,
            },
          ],
        });

        if (!app || !app.demoMode) {
          throw new GrantError('invalid_client');
        }

        let appMember = null;
        if (appMemberId === '') {
          logger.verbose('Demo login: Creating new demo user');

          const role =
            appRole === ''
              ? app.definition.security?.default?.role ??
                Object.keys(app.definition.security?.roles)[0]
              : appRole;

          if (!role) {
            throw new GrantError('invalid_request');
          }

          await transactional(async (transaction) => {
            const identifier = Math.random().toString(36).slice(2);
            const demoEmail = `demo-${identifier}@example.com`;
            appMember = await AppMember.create(
              {
                AppId: appId,
                role,
                email: demoEmail,
                emailVerified: true,
                name: `${role} ${identifier}`,
                timezone: '',
                demo: true,
              },
              { transaction },
            );
          });
        } else {
          appMember = { id: appMemberId };
        }

        aud = clientId;
        sub = appMember?.id;
        scope = requestedScope;
        refreshToken = true;
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
