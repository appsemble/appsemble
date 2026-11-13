import { assertKoaCondition, logger, throwKoaError } from '@appsemble/node-utils';
import {
  OrganizationPermission,
  type OrganizationSsoConfiguration,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { type Context } from 'koa';

import {
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
  const current = await OrganizationSso.findByPk(organizationId);
  assertKoaCondition(
    current?.managedBy !== 'deployment',
    ctx,
    409,
    'These single sign-on settings are managed by the deployment.',
  );
  assertKoaCondition(
    typeof ctx.state.authTime === 'number' && Date.now() / 1000 - ctx.state.authTime < 600,
    ctx,
    403,
    'Sign in again before changing single sign-on settings.',
  );
  let configuration: OrganizationSsoConfiguration;
  try {
    configuration = validateOrganizationSsoConfiguration(ctx.request.body);
  } catch (error) {
    throwKoaError(ctx, 400, (error as Error).message);
  }
  assertKoaCondition(
    !hasOrganizationSsoProviderChanged(current, configuration),
    ctx,
    409,
    'Verify this provider before saving its connection settings.',
  );
  const member = await OrganizationMember.findOne({
    where: { OrganizationId: organizationId, UserId: ctx.user!.id },
  });
  const session = current && (await validateOrganizationSsoSession(ctx, current));
  const keepsMappedOwner =
    !member!.guest &&
    session != null &&
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
  let sso: OrganizationSso;
  try {
    sso = await applyOrganizationSsoConfiguration(organizationId, configuration, 'studio');
  } catch (error) {
    throwKoaError(ctx, 400, (error as Error).message);
  }
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
  const sso = await OrganizationSso.findByPk(organizationId);
  assertKoaCondition(
    sso?.managedBy !== 'deployment',
    ctx,
    409,
    'These single sign-on settings are managed by the deployment.',
  );
  assertKoaCondition(
    typeof ctx.state.authTime === 'number' && Date.now() / 1000 - ctx.state.authTime < 600,
    ctx,
    403,
    'Sign in again before changing single sign-on settings.',
  );
  assertKoaCondition(
    (await OrganizationMember.count({ where: { OrganizationId: organizationId, role: null } })) ===
      0,
    ctx,
    409,
    'Convert or remove group-managed members before removing single sign-on.',
  );
  await OrganizationSsoSession.destroy({ where: { OrganizationId: organizationId } });
  await sso?.destroy();
  logger.info(
    `User ${ctx.user!.id} removed single sign-on settings for organization ${organizationId}`,
  );
  ctx.status = 204;
}
