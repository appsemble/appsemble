import { assertKoaCondition, logger, throwKoaError } from '@appsemble/node-utils';
import {
  ORGANIZATION_SSO_RECENT_SIGN_IN_REQUIRED,
  OrganizationPermission,
  type OrganizationSsoConfiguration,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { type Context } from 'koa';

import {
  EmailAuthorization,
  getDB,
  OAuthAuthorization,
  Organization,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoSession,
} from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import {
  applyOrganizationSsoConfiguration,
  getOrganizationSsoSettings,
  hasOrganizationSsoProviderChanged,
  resolveOrganizationSsoRoles,
  validateOrganizationSsoConfiguration,
} from '../../../utils/organizationSso.js';
import { validateOrganizationSsoSession } from '../../../utils/organizationSsoSession.js';

export async function getOrganizationSso(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });
  const sso = await OrganizationSso.findByPk(organizationId);
  ctx.body = sso ? getOrganizationSsoSettings(sso) : null;
  ctx.status = 200;
}

export async function putOrganizationSso(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });
  assertKoaCondition(
    typeof ctx.state.authTime === 'number' && Date.now() / 1000 - ctx.state.authTime < 600,
    ctx,
    403,
    'Sign in again before changing single sign-on settings.',
    { code: ORGANIZATION_SSO_RECENT_SIGN_IN_REQUIRED },
  );
  let configuration: OrganizationSsoConfiguration;
  try {
    configuration = validateOrganizationSsoConfiguration(ctx.request.body, 'studio');
  } catch (error) {
    throwKoaError(ctx, 400, (error as Error).message);
  }
  const initial = await OrganizationSso.findByPk(organizationId);
  const session = initial && (await validateOrganizationSsoSession(ctx, initial));
  const sso = await getDB().transaction(async (transaction) => {
    await Organization.findByPk(organizationId, { transaction, lock: transaction.LOCK.UPDATE });
    const current = await OrganizationSso.findByPk(organizationId, { transaction });
    assertKoaCondition(
      current?.managedBy !== 'deployment',
      ctx,
      409,
      'These single sign-on settings are managed by the deployment.',
    );
    assertKoaCondition(
      !hasOrganizationSsoProviderChanged(current, configuration),
      ctx,
      409,
      'Verify this provider before saving its connection settings.',
    );
    const member = await OrganizationMember.findOne({
      where: { OrganizationId: organizationId, UserId: ctx.user!.id },
      transaction,
    });
    const keepsMappedOwner =
      !member!.guest &&
      session != null &&
      current?.configurationUpdated.getTime() === initial?.configurationUpdated.getTime() &&
      resolveOrganizationSsoRoles(session.groups, configuration.roleMappings).includes(
        PredefinedOrganizationRole.Owner,
      );
    const keepsManualOwner =
      member!.role === PredefinedOrganizationRole.Owner &&
      configuration.allowedLoginMethods.includes(ctx.state.loginMethod) &&
      (configuration.policy === 'optional' ||
        (member!.guest && configuration.policy === 'required-with-guests'));
    assertKoaCondition(
      keepsMappedOwner || keepsManualOwner,
      ctx,
      403,
      'Keep an accessible Owner login or verify an Owner group before changing single sign-on policy.',
    );
    try {
      return await applyOrganizationSsoConfiguration(
        organizationId,
        configuration,
        'studio',
        transaction,
      );
    } catch (error) {
      throwKoaError(ctx, 400, (error as Error).message);
    }
  });
  ctx.body = getOrganizationSsoSettings(sso);
  logger.info(
    `User ${ctx.user!.id} updated single sign-on settings for organization ${organizationId}`,
  );
}

export async function deleteOrganizationSso(ctx: Context): Promise<void> {
  const { organizationId } = ctx.pathParams;
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });
  assertKoaCondition(
    typeof ctx.state.authTime === 'number' && Date.now() / 1000 - ctx.state.authTime < 600,
    ctx,
    403,
    'Sign in again before changing single sign-on settings.',
    { code: ORGANIZATION_SSO_RECENT_SIGN_IN_REQUIRED },
  );
  await getDB().transaction(async (transaction) => {
    await Organization.findByPk(organizationId, { transaction, lock: transaction.LOCK.UPDATE });
    const sso = await OrganizationSso.findByPk(organizationId, { transaction });
    assertKoaCondition(
      sso?.managedBy !== 'deployment',
      ctx,
      409,
      'These single sign-on settings are managed by the deployment.',
    );
    assertKoaCondition(
      (await EmailAuthorization.count({
        where: { UserId: ctx.user!.id, verified: true },
        transaction,
      })) > 0 ||
        (await OAuthAuthorization.count({ where: { UserId: ctx.user!.id }, transaction })) > 0,
      ctx,
      409,
      'Keep a verified email address or a personal social login before removing organization SSO.',
    );
    // The removing Owner keeps Owner access when their role is group-managed.
    await OrganizationMember.update(
      { role: PredefinedOrganizationRole.Owner },
      {
        where: { OrganizationId: organizationId, UserId: ctx.user!.id, role: null, guest: false },
        transaction,
      },
    );
    await OrganizationMember.destroy({
      where: { OrganizationId: organizationId, role: null, guest: false },
      transaction,
    });
    await OrganizationSsoSession.destroy({
      where: { OrganizationId: organizationId },
      transaction,
    });
    await sso?.destroy({ transaction });
  });
  logger.info(
    `User ${ctx.user!.id} removed single sign-on settings for organization ${organizationId}`,
  );
  ctx.status = 204;
}
