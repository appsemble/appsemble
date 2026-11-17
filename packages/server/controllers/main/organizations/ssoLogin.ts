import { createHash, randomUUID } from 'node:crypto';

import { assertKoaCondition, logger, throwKoaError } from '@appsemble/node-utils';
import {
  OrganizationPermission,
  type OrganizationSsoConfiguration,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { type Context } from 'koa';
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  fetchUserInfo,
  type IDToken,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type TokenEndpointResponse,
  type TokenEndpointResponseHelpers,
} from 'openid-client';
import { UniqueConstraintError } from 'sequelize';

import {
  EmailAuthorization,
  getDB,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoIdentity,
  OrganizationSsoSession,
  User,
} from '../../../models/index.js';
import { argv } from '../../../utils/argv.js';
import { processEmailAuthorization } from '../../../utils/auth.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { decrypt, encrypt } from '../../../utils/crypto.js';
import { getOrganizationOidcConfiguration } from '../../../utils/organizationOidc.js';
import {
  applyOrganizationSsoConfiguration,
  getOrganizationMemberRoles,
  lockOrganizationSsoIdentity,
  resolveOrganizationSsoRoles,
  synchronizeOrganizationSsoMembership,
  validateOrganizationSsoConfiguration,
} from '../../../utils/organizationSso.js';
import { createOrganizationSsoTokenResponse } from '../../../utils/organizationSsoSession.js';
import { getValkeyClient } from '../../../utils/valkey.js';

const flowCookie = 'organization-oidc';

interface LoginFlow {
  organizationId: string;
  configurationUpdated: number;
  state: string;
  nonce: string;
  codeVerifier: string;
  expires: number;
  linkUserId?: string;
  candidateId?: string;
}

interface CandidateConfiguration {
  configuration: OrganizationSsoConfiguration;
  expectedUpdated: string | null;
  userId: string;
  organizationId: string;
}

function assertSameOrigin(ctx: Context): void {
  let origin = ctx.get('origin');
  if (!origin && ctx.get('referer')) {
    try {
      origin = new URL(ctx.get('referer')).origin;
    } catch {
      throwKoaError(ctx, 403, 'The login request origin is invalid');
    }
  }
  assertKoaCondition(
    origin === new URL(argv.host).origin,
    ctx,
    403,
    'The login request origin is invalid',
  );
}

export async function getOrganizationSsoLogin(ctx: Context): Promise<void> {
  const sso = await OrganizationSso.findByPk(ctx.pathParams.organizationId);
  assertKoaCondition(sso != null, ctx, 404, 'Organization SSO is not configured');
  ctx.body = {
    name: sso.name,
    policy: sso.policy,
    allowedLoginMethods: sso.allowedLoginMethods,
  };
}

export async function startOrganizationSsoLogin(ctx: Context): Promise<void> {
  assertSameOrigin(ctx);
  const { organizationId } = ctx.pathParams;
  const current = await OrganizationSso.findByPk(organizationId);
  const { configuration, link } = ctx.request.body;
  assertKoaCondition(
    !link || ctx.user != null,
    ctx,
    401,
    'Sign in before linking organization SSO',
  );
  let sso = current;
  let candidateId: string | undefined;
  if (configuration) {
    assertKoaCondition(link === true && ctx.user != null, ctx, 401, 'Sign in before verifying SSO');
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId,
      requiredPermissions: [OrganizationPermission.UpdateOrganizations],
    });
    assertKoaCondition(
      typeof ctx.state.authTime === 'number' && ctx.state.authTime >= Date.now() / 1000 - 600,
      ctx,
      403,
      'Sign in again before changing single sign-on settings',
    );
    assertKoaCondition(
      current?.managedBy !== 'deployment',
      ctx,
      409,
      'SSO is managed by the deployment',
    );
    let normalized: OrganizationSsoConfiguration;
    try {
      normalized = validateOrganizationSsoConfiguration(configuration, 'studio');
    } catch (error) {
      throwKoaError(ctx, 400, (error as Error).message);
    }
    assertKoaCondition(
      Boolean(normalized.clientSecret) ||
        Boolean(
          current &&
          normalized.issuer === current.issuer &&
          normalized.clientId === current.clientId,
        ),
      ctx,
      400,
      'A client secret is required for this provider',
    );
    const candidate: CandidateConfiguration = {
      configuration: {
        ...normalized,
        clientSecret: normalized.clientSecret ?? decrypt(current!.clientSecret, argv.aesSecret),
      },
      expectedUpdated: current?.updated.toISOString() ?? null,
      userId: ctx.user!.id,
      organizationId,
    };
    const cache = getValkeyClient();
    assertKoaCondition(
      cache?.status === 'ready',
      ctx,
      503,
      'SSO verification is temporarily unavailable',
    );
    candidateId = randomUUID();
    await cache.set(
      `organization-sso-candidate:${candidateId}`,
      encrypt(JSON.stringify(candidate), argv.aesSecret).toString('base64url'),
      'EX',
      600,
    );
    sso = OrganizationSso.build({
      ...candidate.configuration,
      OrganizationId: organizationId,
      clientSecret: encrypt(candidate.configuration.clientSecret!, argv.aesSecret),
      configurationUpdated: new Date(),
    });
  }
  assertKoaCondition(sso != null, ctx, 404, 'Organization SSO is not configured');
  const config = await getOrganizationOidcConfiguration(sso);
  const codeVerifier = randomPKCECodeVerifier();
  const flow: LoginFlow = {
    organizationId: sso.OrganizationId,
    configurationUpdated: sso.configurationUpdated.getTime(),
    state: randomState(),
    nonce: randomNonce(),
    codeVerifier,
    expires: Date.now() + 10 * 60 * 1000,
    ...(link ? { linkUserId: ctx.user!.id } : {}),
    ...(candidateId ? { candidateId } : {}),
  };
  const authorizationUrl = buildAuthorizationUrl(config, {
    redirect_uri: String(new URL('/callback', argv.host)),
    scope: sso.scope,
    state: flow.state,
    nonce: flow.nonce,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    code_challenge: await calculatePKCECodeChallenge(codeVerifier),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    code_challenge_method: 'S256',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ...(link ? { max_age: '0' } : {}),
  });
  ctx.cookies.set(flowCookie, encrypt(JSON.stringify(flow), argv.aesSecret).toString('base64url'), {
    httpOnly: true,
    secure: new URL(argv.host).protocol === 'https:',
    sameSite: 'lax',
    signed: false,
    path: `/api/organizations/${sso.OrganizationId}/sso`,
    maxAge: 10 * 60 * 1000,
    overwrite: true,
  });
  ctx.body = { authorizationUrl: String(authorizationUrl) };
}

export async function completeOrganizationSsoLogin(ctx: Context): Promise<void> {
  assertSameOrigin(ctx);
  const { organizationId } = ctx.pathParams;
  const cookie = ctx.cookies.get(flowCookie, { signed: false });
  ctx.cookies.set(flowCookie, null, {
    signed: false,
    path: `/api/organizations/${organizationId}/sso`,
    overwrite: true,
  });
  let flow: LoginFlow;
  try {
    flow = JSON.parse(decrypt(Buffer.from(cookie!, 'base64url'), argv.aesSecret)) as LoginFlow;
  } catch {
    throwKoaError(ctx, 401, 'The organization SSO login has expired');
  }
  assertKoaCondition(
    flow.organizationId === organizationId &&
      flow.expires > Date.now() &&
      flow.state === ctx.request.body.state,
    ctx,
    401,
    'The organization SSO login state is invalid',
  );
  assertKoaCondition(
    !flow.linkUserId || flow.linkUserId === ctx.user?.id,
    ctx,
    401,
    'Sign in to the account which initiated SSO linking',
  );
  let candidate: CandidateConfiguration | undefined;
  let selectedSso = await OrganizationSso.findByPk(organizationId);
  if (flow.candidateId) {
    const cache = getValkeyClient();
    assertKoaCondition(
      cache?.status === 'ready',
      ctx,
      503,
      'SSO verification is temporarily unavailable',
    );
    const stored = await cache.getdel(`organization-sso-candidate:${flow.candidateId}`);
    assertKoaCondition(stored != null, ctx, 401, 'The SSO verification has expired');
    candidate = JSON.parse(
      decrypt(Buffer.from(stored, 'base64url'), argv.aesSecret),
    ) as CandidateConfiguration;
    assertKoaCondition(
      candidate.organizationId === organizationId && candidate.userId === flow.linkUserId,
      ctx,
      401,
      'The SSO verification does not belong to this account',
    );
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId,
      requiredPermissions: [OrganizationPermission.UpdateOrganizations],
    });
    selectedSso = OrganizationSso.build({
      ...candidate.configuration,
      OrganizationId: organizationId,
      clientSecret: encrypt(candidate.configuration.clientSecret!, argv.aesSecret),
      configurationUpdated: new Date(flow.configurationUpdated),
    });
  }
  const sso = selectedSso;
  assertKoaCondition(
    sso != null && flow.configurationUpdated === sso.configurationUpdated.getTime(),
    ctx,
    401,
    'The organization SSO configuration has changed',
  );
  const callbackUrl = new URL('/callback', argv.host);
  callbackUrl.searchParams.set('code', ctx.request.body.code);
  callbackUrl.searchParams.set('state', ctx.request.body.state);
  if (ctx.request.body.iss) {
    callbackUrl.searchParams.set('iss', ctx.request.body.iss);
  }
  let tokens: TokenEndpointResponse & TokenEndpointResponseHelpers;
  let claims: IDToken;
  let info: Record<string, unknown>;
  try {
    const config = await getOrganizationOidcConfiguration(sso);
    tokens = await authorizationCodeGrant(config, callbackUrl, {
      expectedState: flow.state,
      expectedNonce: flow.nonce,
      pkceCodeVerifier: flow.codeVerifier,
      idTokenExpected: true,
      ...(flow.linkUserId ? { maxAge: 0 } : {}),
    });
    if (!tokens.expires_in || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0) {
      throw new Error('The provider access token has no valid lifetime');
    }
    claims = tokens.claims()!;
    info = config.serverMetadata().userinfo_endpoint
      ? { ...claims, ...(await fetchUserInfo(config, tokens.access_token, claims.sub)) }
      : claims;
  } catch {
    throwKoaError(ctx, 401, 'The organization SSO response is invalid');
  }
  const rawGroups = info[sso.groupClaim];
  const groups = Array.isArray(rawGroups)
    ? rawGroups.filter((group): group is string => typeof group === 'string')
    : typeof rawGroups === 'string'
      ? [rawGroups]
      : [];
  const identity = await OrganizationSsoIdentity.findOne({
    where: { issuer: sso.issuer, subject: claims.sub },
  });
  if (candidate) {
    assertKoaCondition(
      resolveOrganizationSsoRoles(groups, sso.roleMappings).includes(
        PredefinedOrganizationRole.Owner,
      ),
      ctx,
      403,
      'The proposed provider must grant your account the Owner role',
    );
  }
  try {
    const loginResponse = await getDB().transaction(async (transaction) => {
      await lockOrganizationSsoIdentity({ issuer: sso.issuer, subject: claims.sub }, transaction);
      let linkedIdentity = await OrganizationSsoIdentity.findOne({
        where: { issuer: sso.issuer, subject: claims.sub },
        transaction,
      });
      assertKoaCondition(
        !identity || linkedIdentity?.id === identity.id,
        ctx,
        409,
        'The organization SSO identity changed during sign-in. Sign in again.',
      );
      assertKoaCondition(
        !flow.linkUserId || !linkedIdentity || linkedIdentity.UserId === flow.linkUserId,
        ctx,
        403,
        'This SSO identity is linked to another Appsemble account',
      );
      const memberUserId = flow.linkUserId ?? linkedIdentity?.UserId;
      await Organization.findByPk(organizationId, { transaction, lock: transaction.LOCK.UPDATE });
      const saved = await OrganizationSso.findByPk(organizationId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      let activeSso = sso;
      if (candidate) {
        assertKoaCondition(
          (saved?.updated.toISOString() ?? null) === candidate.expectedUpdated,
          ctx,
          409,
          'The SSO configuration changed during verification; verify it again',
        );
        activeSso = await applyOrganizationSsoConfiguration(
          organizationId,
          candidate.configuration,
          'studio',
          transaction,
        );
      } else {
        assertKoaCondition(
          saved != null && saved.configurationUpdated.getTime() === flow.configurationUpdated,
          ctx,
          401,
          'The organization SSO configuration has changed',
        );
        activeSso = saved;
      }
      const member = memberUserId
        ? await OrganizationMember.findOne({
            where: { OrganizationId: organizationId, UserId: memberUserId },
            transaction,
          })
        : null;
      const guestAllowed =
        member?.guest &&
        activeSso.policy !== 'required' &&
        activeSso.allowedLoginMethods.includes('oidc');
      if (!resolveOrganizationSsoRoles(groups, activeSso.roleMappings).length && !guestAllowed) {
        if (memberUserId) {
          await synchronizeOrganizationSsoMembership({
            organizationId,
            userId: memberUserId,
            groups,
            transaction,
          });
        }
        if (linkedIdentity) {
          await OrganizationSsoSession.destroy({
            where: { OrganizationId: organizationId, OrganizationSsoIdentityId: linkedIdentity.id },
            transaction,
          });
        }
        return null;
      }
      let user = memberUserId ? await User.findByPk(memberUserId, { transaction }) : null;
      if (!user) {
        assertKoaCondition(!memberUserId, ctx, 401, 'The linked Appsemble account is unavailable');
        const email = typeof info.email === 'string' ? info.email.toLowerCase() : undefined;
        if (email) {
          const existingEmail = await EmailAuthorization.findByPk(email, { transaction });
          const existingUser = await User.findOne({ where: { primaryEmail: email }, transaction });
          assertKoaCondition(
            !existingEmail && !existingUser,
            ctx,
            409,
            'Sign in to your existing Appsemble account and link organization SSO',
          );
        }
        user = await User.create(
          {
            primaryEmail: email,
            name: typeof info.name === 'string' ? info.name : undefined,
            timezone: typeof info.zoneinfo === 'string' ? info.zoneinfo : ctx.request.body.timezone,
          },
          { transaction },
        );
        if (email) {
          await processEmailAuthorization(
            ctx.mailer,
            user.id,
            user.name!,
            email,
            info.email_verified === true,
            transaction,
          );
        }
      }
      if (!linkedIdentity) {
        linkedIdentity = await OrganizationSsoIdentity.create(
          { issuer: sso.issuer, subject: claims.sub, UserId: user.id },
          { transaction },
        );
      }
      const synchronizedMember = await synchronizeOrganizationSsoMembership({
        organizationId,
        userId: user.id,
        groups,
        transaction,
      });
      if (candidate) {
        assertKoaCondition(
          synchronizedMember != null &&
            getOrganizationMemberRoles(synchronizedMember).includes(
              PredefinedOrganizationRole.Owner,
            ),
          ctx,
          403,
          'Your account cannot retain Owner access under the proposed configuration',
        );
      }
      await OrganizationSsoSession.update(
        { groups },
        {
          where: { OrganizationId: organizationId, OrganizationSsoIdentityId: linkedIdentity.id },
          transaction,
        },
      );
      const sessionId = randomUUID();
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const response = createOrganizationSsoTokenResponse(
        { id: sessionId, expires },
        user.id,
        typeof claims.auth_time === 'number' ? claims.auth_time : 0,
      );
      await OrganizationSsoSession.create(
        {
          id: sessionId,
          OrganizationId: organizationId,
          OrganizationSsoIdentityId: linkedIdentity.id,
          refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token, argv.aesSecret) : null,
          refreshTokenHash: createHash('sha256').update(response.refresh_token!).digest('hex'),
          accessTokenExpires: new Date(Date.now() + Math.min(tokens.expires_in!, 3600) * 1000),
          expires,
          configurationUpdated: activeSso.configurationUpdated,
          groups,
        },
        { transaction },
      );
      return response;
    });
    assertKoaCondition(
      loginResponse != null,
      ctx,
      403,
      'No organization roles match this identity',
    );
    ctx.body = loginResponse;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    if (candidate) {
      logger.info(`Organization SSO settings saved by user ${ctx.user!.id} for ${organizationId}`);
    }
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(
        ctx,
        409,
        'Sign in to your existing Appsemble account and link organization SSO',
      );
    }
    throw error;
  }
}
