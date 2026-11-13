import { createHash } from 'node:crypto';

import { type TokenResponse } from '@appsemble/types';
import { type Context } from 'koa';
import { ClientError, fetchUserInfo, refreshTokenGrant, ResponseBodyError } from 'openid-client';
import { type Transaction } from 'sequelize';

import {
  getDB,
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
 * Verify a provider-backed session and refresh its claims when its access token expires.
 *
 * @param ctx The authenticated request.
 * @param sso The required organization's provider.
 * @param transaction The transaction which serializes provider token renewal.
 * @param refreshToken The Studio refresh token, when rotating the Studio session.
 * @param userId The verified account id when credentials authenticate before ctx.user is assigned.
 * @returns The active session, or null when its authentication is no longer valid.
 */
async function getActiveSession(
  ctx: Context,
  sso: OrganizationSso,
  transaction: Transaction,
  refreshToken?: string,
  userId = ctx.user?.id,
): Promise<OrganizationSsoSession | null> {
  if (ctx.state.loginMethod !== 'oidc' || !ctx.state.organizationSsoSessionId || !userId) {
    return null;
  }
  const initial = await OrganizationSsoSession.findByPk(ctx.state.organizationSsoSessionId, {
    transaction,
  });
  if (!initial) {
    return null;
  }
  const identity = await OrganizationSsoIdentity.findByPk(initial.OrganizationSsoIdentityId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const session = await OrganizationSsoSession.findByPk(initial.id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (
    !session ||
    session.OrganizationId !== sso.OrganizationId ||
    identity?.UserId !== userId ||
    identity.issuer !== sso.issuer ||
    session.configurationUpdated.getTime() !== sso.configurationUpdated.getTime() ||
    (!ctx.state.clientCredentials &&
      (session.interactiveRevoked || session.expires.getTime() <= Date.now()))
  ) {
    return null;
  }
  session.OrganizationSsoIdentity = identity;
  if (
    refreshToken &&
    session.refreshTokenHash !== createHash('sha256').update(refreshToken).digest('hex')
  ) {
    await session.update({ interactiveRevoked: true }, { transaction });
    return null;
  }
  if (session.accessTokenExpires.getTime() > Date.now()) {
    return session;
  }
  if (!session.refreshToken) {
    await session.destroy({ transaction });
    return null;
  }

  try {
    const config = await getOrganizationOidcConfiguration(sso);
    const tokens = await refreshTokenGrant(config, decrypt(session.refreshToken, argv.aesSecret));
    if (!tokens.expires_in || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0) {
      throw new Error('The provider access token has no valid lifetime');
    }
    const claims = tokens.claims();
    const { subject } = session.OrganizationSsoIdentity;
    if (claims && claims.sub !== subject) {
      await session.destroy({ transaction });
      return null;
    }
    const info = config.serverMetadata().userinfo_endpoint
      ? { ...claims, ...(await fetchUserInfo(config, tokens.access_token, subject)) }
      : claims;
    if (!info) {
      throw new Error('The provider did not return refreshed identity claims');
    }
    const rawGroups = info[sso.groupClaim];
    const groups = Array.isArray(rawGroups)
      ? rawGroups.filter((group): group is string => typeof group === 'string')
      : typeof rawGroups === 'string'
        ? [rawGroups]
        : [];
    await OrganizationSsoSession.update(
      { groups },
      {
        where: {
          OrganizationId: session.OrganizationId,
          OrganizationSsoIdentityId: session.OrganizationSsoIdentityId,
        },
        transaction,
      },
    );
    await session.update(
      {
        accessToken: encrypt(tokens.access_token, argv.aesSecret),
        ...(tokens.refresh_token
          ? { refreshToken: encrypt(tokens.refresh_token, argv.aesSecret) }
          : {}),
        accessTokenExpires: new Date(Date.now() + Math.min(tokens.expires_in, 3600) * 1000),
        groups,
      },
      { transaction },
    );
    return session;
  } catch (error) {
    if (
      (error instanceof ResponseBodyError && error.error === 'invalid_grant') ||
      (error instanceof ClientError &&
        ['OAUTH_JWT_CLAIM_COMPARISON_FAILED', 'OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED'].includes(
          error.code ?? '',
        ))
    ) {
      await session.destroy({ transaction });
    }
    return null;
  }
}

/**
 * Validate that the current request satisfies an organization's SSO requirement.
 *
 * @param ctx The authenticated request.
 * @param sso The organization's provider configuration.
 * @param userId The verified account id when credentials authenticate before ctx.user is assigned.
 * @returns Fresh provider groups and subject, or null for an invalid session.
 */
export function validateOrganizationSsoSession(
  ctx: Context,
  sso: OrganizationSso,
  userId?: string,
): Promise<VerifiedSession | null> {
  return getDB().transaction(async (transaction) => {
    const session = await getActiveSession(ctx, sso, transaction, undefined, userId);
    return session
      ? { groups: session.groups, subject: session.OrganizationSsoIdentity!.subject }
      : null;
  });
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
  const initial = await OrganizationSsoSession.findByPk(ctx.state.organizationSsoSessionId);
  const sso = initial && (await OrganizationSso.findByPk(initial.OrganizationId));
  if (!sso) {
    return null;
  }
  return getDB().transaction(async (transaction) => {
    const session = await getActiveSession(ctx, sso, transaction, refreshToken);
    if (!session) {
      return null;
    }
    const response = createOrganizationSsoTokenResponse(session, ctx.user!.id, ctx.state.authTime);
    await session.update(
      { refreshTokenHash: createHash('sha256').update(response.refresh_token!).digest('hex') },
      { transaction },
    );
    return response;
  });
}
