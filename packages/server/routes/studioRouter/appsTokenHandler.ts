import querystring from 'node:querystring';

import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { compare } from 'bcrypt';
import { isPast } from 'date-fns';
import { type Context } from 'koa';
import raw from 'raw-body';

import {
  App,
  type AppMember as AppMemberType,
  getAppDB,
  OAuth2ClientCredentials,
} from '../../models/index.js';
import {
  createAppMemberRefreshSession,
  revokeAppMemberRefreshSession,
  rotateAppMemberRefreshSession,
} from '../../utils/appMemberRefreshSession.js';
import { createJWTResponse } from '../../utils/createJWTResponse.js';
import { GrantError, hasScope } from '../../utils/oauth2.js';

function checkTokenRequestParameters(
  query: Record<string, string[] | string | undefined>,
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
  let createRefreshSessionForAppId: number | null = null;
  let refreshToken: string | undefined;
  let scope: string | undefined;
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
          // May throw if the origin/referer is not a valid URL, or if both headers are missing.
          const requestOrigin = new URL(header.origin ?? header.referer!);
          const redirect = new URL(redirectUri);
          if (requestOrigin.origin !== redirect.origin) {
            throw new GrantError('invalid_request');
          }
        } catch {
          throw new GrantError('invalid_request');
        }
        const match = clientId.match(/^app:(\d+)/);
        if (!match) {
          throw new GrantError('invalid_client');
        }
        const appId = Number(match[1]);
        const app = await App.findByPk(appId);
        assertKoaCondition(app != null, ctx, 404, 'App not found');
        const { OAuth2AuthorizationCode } = await getAppDB(appId);
        const authorizationCode = await OAuth2AuthorizationCode.findOne({
          attributes: ['expires', 'scope', 'AppMemberId'],
          where: { code, redirectUri },
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
        createRefreshSessionForAppId = appId;
        scope = requestedScope;
        sub = authorizationCode.AppMemberId;
        break;
      }
      case 'client_credentials': {
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
        scope = requestedScope;
        sub = client.UserId;
        break;
      }
      case 'refresh_token': {
        const { refresh_token: providedToken } = checkTokenRequestParameters(query, [
          'refresh_token',
        ]);
        const match = ctx.path.match(/^\/apps\/(\d+)\/auth\/oauth2\/token$/);
        if (!match) {
          throw new GrantError('invalid_request');
        }

        try {
          const payload = await rotateAppMemberRefreshSession(ctx, Number(match[1]), {
            token: providedToken,
          });
          ({ aud, scope, sub } = payload);
          refreshToken = payload.refreshToken;
        } catch {
          throw new GrantError('invalid_grant');
        }
        break;
      }
      case 'revoke_token': {
        const { refresh_token: providedToken } = checkTokenRequestParameters(query, [
          'refresh_token',
        ]);
        const match = ctx.path.match(/^\/apps\/(\d+)\/auth\/oauth2\/token$/);
        if (!match) {
          throw new GrantError('invalid_request');
        }

        await revokeAppMemberRefreshSession(ctx, Number(match[1]), {
          token: providedToken,
        });

        ctx.status = 200;
        ctx.body = {};
        return;
      }
      case 'password': {
        const {
          client_id: clientId,
          password,
          scope: requestedScope,
          username,
        } = checkTokenRequestParameters(query, ['client_id', 'username', 'password', 'scope']);
        const appId = Number(clientId.replace('app:', ''));
        const app = await App.findByPk(appId, { attributes: ['totp'] });
        const { AppMember } = await getAppDB(appId);
        const appMember = await AppMember.findOne({
          where: { email: username.toLowerCase() },
          attributes: ['id', 'password', 'totpEnabled'],
        });

        if (!appMember?.password || !(await compare(password, appMember.password))) {
          throw new GrantError('invalid_client');
        }

        // Check if TOTP verification is required
        const totpSetting = app?.totp ?? 'disabled';
        const memberHasTotpEnabled = appMember.totpEnabled ?? false;

        // TOTP is required if:
        // 1. App setting is 'required' (everyone must use TOTP), OR
        // 2. App setting is 'enabled' and the member has TOTP enabled
        if (totpSetting === 'required' || (totpSetting === 'enabled' && memberHasTotpEnabled)) {
          // Return a response indicating TOTP verification is needed
          // Include totpEnabled so client knows whether to show verification or setup
          ctx.status = 200;
          ctx.body = {
            totpRequired: true,
            totpEnabled: memberHasTotpEnabled,
            memberId: appMember.id,
          };
          return;
        }

        aud = clientId;
        sub = appMember.id;
        scope = requestedScope;
        createRefreshSessionForAppId = appId;
        break;
      }
      case 'urn:ietf:params:oauth:grant-type:demo-login': {
        const {
          appMemberId,
          appRole,
          client_id: clientId,
          scope: requestedScope,
        } = checkTokenRequestParameters(query, [
          'appMemberId',
          'appRole',
          'client_id',
          'refresh_token',
          'scope',
        ]);

        const appId = Number(clientId.replace('app:', ''));
        const { AppMember, Group, GroupMember, sequelize } = await getAppDB(appId);
        const app = await App.findByPk(appId, {
          attributes: ['demoMode', 'definition', 'id', 'OrganizationId'],
        });

        if (!app || !app.demoMode) {
          throw new GrantError('invalid_client');
        }

        let appMember: Pick<AppMemberType, 'id'> | null = null;
        if (appMemberId === '') {
          logger.verbose('Demo login: Creating new demo user');

          const role =
            appRole === ''
              ? (app.definition.security?.default?.role ??
                Object.keys(app.definition.security?.roles ?? {}).at(0))
              : appRole;

          if (!role) {
            throw new GrantError('invalid_request');
          }

          await sequelize.transaction(async (transaction) => {
            const identifier = Math.random().toString(36).slice(2);
            const demoEmail = `demo-${identifier}@example.com`;
            appMember = await AppMember.create(
              {
                roles: [role],
                email: demoEmail,
                emailVerified: true,
                name: `${role} ${identifier}`,
                timezone: '',
                demo: true,
                seed: false,
                ephemeral: false,
              },
              { transaction },
            );
            const appGroups = await Group.findAll();
            await GroupMember.bulkCreate(
              appGroups.map((group) => ({
                GroupId: group.id,
                demo: true,
                AppMemberId: appMember!.id,
              })),
              { transaction },
            );
          });
        } else {
          appMember = { id: appMemberId };
        }

        aud = clientId;
        sub = appMember!.id;
        scope = requestedScope;
        createRefreshSessionForAppId = appId;
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

  if (createRefreshSessionForAppId != null) {
    refreshToken = await createAppMemberRefreshSession(ctx, {
      appId: createRefreshSessionForAppId,
      aud,
      scope,
      sub,
    });
  }

  const tokenResponse = createJWTResponse(sub, { aud, refreshToken: false, scope });
  if (refreshToken) {
    tokenResponse.refresh_token = refreshToken;
  }

  ctx.body = tokenResponse;
}
