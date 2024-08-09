import { assertKoaError } from '@appsemble/node-utils';
import {
  type AppRole,
  type CustomAppPermission,
  type OrganizationPermission,
  type OrganizationRole,
} from '@appsemble/types';
import {
  checkAppRoleAppPermissions,
  checkOrganizationRoleAppPermissions,
  checkOrganizationRoleOrganizationPermissions,
} from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, GroupMember, Organization, OrganizationMember } from '../models/index.js';

// TODO check and fix this logic
async function getAppMemberAcquiredAppRoles(
  appMember: AppMember,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appId: number,
): Promise<string[]> {
  const groupMemberships = await GroupMember.findAll({
    attributes: ['id', 'role'],
    where: {
      AppMemberId: appMember.id,
    },
  });

  const groupRoles = groupMemberships.flatMap((groupMembership) => groupMembership.role);

  return Array.from(new Set([...groupRoles, appMember.role]));
}

async function getAppMemberAppRoles(appMemberId: string, appId: number): Promise<AppRole[]> {
  const appMember = await AppMember.findByPk(appMemberId, { attributes: ['id', 'role'] });

  if (!appMember) {
    return [];
  }

  return getAppMemberAcquiredAppRoles(appMember, appId);
}

async function getUserAppRoles(userId: string, appId: number): Promise<AppRole[]> {
  const appMember = await AppMember.findOne({
    attributes: ['id', 'role'],
    where: {
      AppId: appId,
      UserId: userId,
    },
  });

  if (!appMember) {
    return [];
  }

  return getAppMemberAcquiredAppRoles(appMember, appId);
}

async function getUserOrganizationRoles(
  userId: string,
  organizationId: string,
): Promise<OrganizationRole[]> {
  const organizationMember = await OrganizationMember.findOne({
    attributes: ['role'],
    where: {
      UserId: userId,
      OrganizationId: organizationId,
    },
  });

  if (!organizationMember) {
    return [];
  }

  return [organizationMember.role];
}

export async function checkAppMemberAppPermissions(
  ctx: Context,
  appId: number,
  requiredAppPermissions: CustomAppPermission[],
): Promise<void> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.definition.security, ctx, 404, 'App does not have a security definition');

  const appMember = await AppMember.findByPk(authSubject.id, { attributes: ['id'] });

  assertKoaError(!appMember, ctx, 403, 'App member not found');

  const appMemberAppRoles = await getAppMemberAppRoles(appMember.id, appId);

  assertKoaError(
    !appMemberAppRoles.some((appMemberAppRole) =>
      checkAppRoleAppPermissions(app.definition.security, appMemberAppRole, requiredAppPermissions),
    ),
    ctx,
    403,
    'App member does not have sufficient app permissions.',
  );
}

export async function checkUserAppPermissions(
  ctx: Context,
  appId: number,
  requiredAppPermissions: CustomAppPermission[],
): Promise<void> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition', 'OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.definition.security, ctx, 404, 'App does not have a security definition');

  const userAppRoles = await getUserAppRoles(authSubject.id, appId);

  const userOrganizationRoles = await getUserOrganizationRoles(authSubject.id, app.OrganizationId);

  assertKoaError(
    !(
      userAppRoles.some((userAppRole) =>
        checkAppRoleAppPermissions(app.definition.security, userAppRole, requiredAppPermissions),
      ) ||
      userOrganizationRoles.some((userOrganizationRole) =>
        checkOrganizationRoleAppPermissions(userOrganizationRole, requiredAppPermissions),
      )
    ),
    ctx,
    403,
    'User does not have sufficient app permissions.',
  );
}

export async function checkUserOrganizationPermissions(
  ctx: Context,
  organizationId: string,
  requiredOrganizationPermissions: OrganizationPermission[],
): Promise<void> {
  const { user: authSubject } = ctx;

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  const organizationMember = await OrganizationMember.findOne({
    attributes: ['role'],
    where: {
      UserId: authSubject.id,
      OrganizationId: organizationId,
    },
  });

  assertKoaError(!organizationMember, ctx, 403, 'User is not a member of this organization.');

  const userOrganizationRoles = await getUserOrganizationRoles(authSubject.id, organizationId);

  assertKoaError(
    !userOrganizationRoles.some((userOrganizationRole) =>
      checkOrganizationRoleOrganizationPermissions(
        userOrganizationRole,
        requiredOrganizationPermissions,
      ),
    ),
    ctx,
    403,
    'User does not have sufficient organization permissions.',
  );
}

export function checkAuthSubjectAppPermissions(
  ctx: Context,
  appId: number,
  requiredAppPermissions: CustomAppPermission[],
): Promise<void> {
  const { client } = ctx;

  return client && 'app' in client
    ? checkAppMemberAppPermissions(ctx, appId, requiredAppPermissions)
    : checkUserAppPermissions(ctx, appId, requiredAppPermissions);
}
