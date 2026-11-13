import { createHash } from 'node:crypto';

import { type TokenResponse } from '@appsemble/types';
import { type Context } from 'koa';
import { ClientError, fetchUserInfo, refreshTokenGrant, ResponseBodyError } from 'openid-client';

import {
  type OAuth2ClientCredentials,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
} from '../models/index.js';
import { argv } from './argv.js';
import { createJWTResponse } from './createJWTResponse.js';
import { decrypt, encrypt } from './crypto.js';
import { getOrganizationOidcConfiguration } from './organizationOidc.js';

interface VerifiedSession {
  groups: string[];
  subject: string;
}

/**
 * Issue a rotating Studio refresh token bounded by its organization SSO session.
 *
 * @param session The provider-backed Studio session.
 * @param userId The authenticated Appsemble account.
 * @param authTime The original authentication time in Unix seconds.
 * @returns The Studio token response.
 */
export function createOrganizationSsoTokenResponse(
  session: Pick<OrganizationSsoSession, 'id' | 'expires'>,
  userId: string,
  authTime: number,
): TokenResponse {
  const remaining = Math.floor((session.expires.getTime() - Date.now()) / 1000);
  if (remaining <= 0) {
    throw new Error('The organization SSO session has expired');
  }
  return createJWTResponse(userId, {
    expires: Math.min(3600, remaining),
    refreshExpires: remaining,
    loginMethod: 'oidc',
    organizationSsoSessionId: session.id,
    authTime,
  });
}

/**
 * Check that a session authenticates the request's account for an organization's provider.
 *
 * @param ctx The authenticated request.
 * @param session The provider-backed session including its identity.
 * @param sso The required organization's provider.
 * @param userId The verified account id.
 * @returns Whether the session is bound to the account and the current provider settings.
 */
function isSessionBound(
  ctx: Context,
  session: OrganizationSsoSession,
  sso: OrganizationSso,
  userId: string,
): boolean {
  const identity = session.OrganizationSsoIdentity!;
  return (
    session.OrganizationId === sso.OrganizationId &&
    identity.UserId === userId &&
    identity.issuer === sso.issuer &&
    session.configurationUpdated.getTime() === sso.configurationUpdated.getTime() &&
    (ctx.state.clientCredentials ||
      (!session.interactiveRevoked && session.expires.getTime() > Date.now()))
  );
}

/**
 * Renew the provider grant of a session whose provider access token expired.
 *
 * The provider is contacted outside of any database transaction. Concurrent renewals of the same
 * session are reconciled by comparing the stored provider refresh token.
 *
 * @param session The bound provider-backed session including its identity.
 * @param sso The organization's provider.
 * @returns The current provider groups, or null when the grant is not valid.
 */
async function renewSession(
  session: OrganizationSsoSession,
  sso: OrganizationSso,
): Promise<string[] | null> {
  if (session.accessTokenExpires.getTime() > Date.now()) {
    return session.groups;
  }
  const { refreshToken } = session;
  if (!refreshToken) {
    await session.destroy();
    return null;
  }
  const where = { id: session.id, refreshToken };
  let renewal: { refreshToken?: Buffer; accessTokenExpires: Date; groups: string[] } | undefined;
  try {
    const config = await getOrganizationOidcConfiguration(sso);
    const tokens = await refreshTokenGrant(config, decrypt(refreshToken, argv.aesSecret));
    if (!tokens.expires_in || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0) {
      throw new Error('The provider access token has no valid lifetime');
    }
    const claims = tokens.claims();
    const { subject } = session.OrganizationSsoIdentity!;
    if (!claims || claims.sub === subject) {
      const info = config.serverMetadata().userinfo_endpoint
        ? { ...claims, ...(await fetchUserInfo(config, tokens.access_token, subject)) }
        : claims;
      if (!info) {
        throw new Error('The provider did not return refreshed identity claims');
      }
      const rawGroups = info[sso.groupClaim];
      renewal = {
        ...(tokens.refresh_token
          ? { refreshToken: encrypt(tokens.refresh_token, argv.aesSecret) }
          : {}),
        accessTokenExpires: new Date(Date.now() + Math.min(tokens.expires_in, 3600) * 1000),
        groups: Array.isArray(rawGroups)
          ? rawGroups.filter((group): group is string => typeof group === 'string')
          : typeof rawGroups === 'string'
            ? [rawGroups]
            : [],
      };
    }
  } catch (error) {
    if (!(
      (error instanceof ResponseBodyError && error.error === 'invalid_grant') ||
      (error instanceof ClientError &&
        ['OAUTH_JWT_CLAIM_COMPARISON_FAILED', 'OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED'].includes(
          error.code ?? '',
        ))
    )) {
      return null;
    }
  }
  if (renewal) {
    const [renewed] = await OrganizationSsoSession.update(renewal, { where });
    if (renewed) {
      await OrganizationSsoSession.update(
        { groups: renewal.groups },
        {
          where: {
            OrganizationId: session.OrganizationId,
            OrganizationSsoIdentityId: session.OrganizationSsoIdentityId,
          },
        },
      );
      return renewal.groups;
    }
  } else if (await OrganizationSsoSession.destroy({ where })) {
    return null;
  }
  // Another request renewed this grant with a newer provider refresh token.
  const current = await OrganizationSsoSession.findByPk(session.id);
  return current && current.accessTokenExpires.getTime() > Date.now() ? current.groups : null;
}

/**
 * Validate that the current request satisfies an organization's SSO requirement.
 *
 * @param ctx The authenticated request.
 * @param sso The organization's provider configuration.
 * @param userId The verified account id when credentials authenticate before ctx.user is assigned.
 * @returns Fresh provider groups and subject, or null for an invalid session.
 */
export async function validateOrganizationSsoSession(
  ctx: Context,
  sso: OrganizationSso,
  userId = ctx.user?.id,
): Promise<VerifiedSession | null> {
  if (ctx.state.loginMethod !== 'oidc' || !ctx.state.organizationSsoSessionId || !userId) {
    return null;
  }
  const session = await OrganizationSsoSession.findOne({
    where: { id: ctx.state.organizationSsoSessionId, OrganizationId: sso.OrganizationId },
    include: [OrganizationSsoIdentity],
  });
  if (!session || !isSessionBound(ctx, session, sso, userId)) {
    return null;
  }
  const groups = await renewSession(session, sso);
  return groups && { groups, subject: session.OrganizationSsoIdentity!.subject };
}

/**
 * Check that OIDC-backed personal credentials still have a valid provider grant.
 *
 * @param ctx The request authenticating with the personal credentials.
 * @param credentials The persisted and authenticated personal credentials.
 * @returns Whether their source authentication remains valid.
 */
export async function validateOrganizationSsoCredential(
  ctx: Context,
  credentials: Pick<OAuth2ClientCredentials, 'loginMethod' | 'OrganizationSsoSessionId' | 'UserId'>,
): Promise<boolean> {
  if (credentials.loginMethod !== 'oidc') {
    return true;
  }
  if (!credentials.OrganizationSsoSessionId) {
    return false;
  }
  const session = await OrganizationSsoSession.findByPk(credentials.OrganizationSsoSessionId);
  if (!session) {
    return false;
  }
  const sso = await OrganizationSso.findByPk(session.OrganizationId);
  if (!sso) {
    return false;
  }
  ctx.state.loginMethod = 'oidc';
  ctx.state.organizationSsoSessionId = session.id;
  ctx.state.clientCredentials = true;
  return Boolean(await validateOrganizationSsoSession(ctx, sso, credentials.UserId));
}

/**
 * Rotate a Studio refresh token after validating its organization authentication.
 *
 * @param ctx The authenticated refresh request.
 * @param refreshToken The presented Studio refresh token.
 * @returns A replacement token response, or null for an invalid session or replay.
 */
export async function refreshOrganizationSsoSession(
  ctx: Context,
  refreshToken: string,
): Promise<TokenResponse | null> {
  if (ctx.state.loginMethod !== 'oidc') {
    return null;
  }
  const session = await OrganizationSsoSession.findByPk(ctx.state.organizationSsoSessionId, {
    include: [OrganizationSsoIdentity],
  });
  const sso = session && (await OrganizationSso.findByPk(session.OrganizationId));
  if (!sso || !isSessionBound(ctx, session, sso, ctx.user!.id)) {
    return null;
  }
  const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
  if (session.refreshTokenHash !== refreshTokenHash) {
    await session.destroy();
    return null;
  }
  if (!(await renewSession(session, sso))) {
    return null;
  }
  const response = createOrganizationSsoTokenResponse(session, ctx.user!.id, ctx.state.authTime);
  const [rotated] = await OrganizationSsoSession.update(
    { refreshTokenHash: createHash('sha256').update(response.refresh_token!).digest('hex') },
    { where: { id: session.id, refreshTokenHash } },
  );
  if (!rotated) {
    // A concurrent refresh already redeemed this Studio refresh token.
    await session.destroy();
    return null;
  }
  return response;
}
