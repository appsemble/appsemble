import { checkAppRoleAppPermissions, checkGuestAppPermissions } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import {
  appOrganizationPermissionMapping,
  type AppPermission,
  type AppRole,
  type CustomAppPermission,
  type CustomAppResourcePermission,
  type OrganizationPermission,
  type PredefinedOrganizationRole,
  predefinedOrganizationRolePermissions,
} from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, GroupMember, Organization, OrganizationMember } from '../models/index.js';

interface CheckAppPermissionsParams {
  context: Context;
  appId: number;
  groupId?: number;
  requiredPermissions: CustomAppPermission[];
}

interface CheckOrganizationPermissionsParams {
  context: Context;
  organizationId: string;
  requiredPermissions: OrganizationPermission[];
}

async function getAppMemberScopedRole(appMember: AppMember, groupId?: number): Promise<AppRole> {
  if (!appMember) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  if (groupId) {
    const groupMember = await GroupMember.findOne({
      where: {
        AppMemberId: appMember.id,
        GroupId: groupId,
      },
    });

    if (!groupMember) {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      return null;
    }

    return groupMember.role;
  }

  return appMember.role;
}

async function getAppMemberAppRole(
  appMemberId: string,
  appId: number,
  groupId?: number,
): Promise<AppRole> {
  const appMember = await AppMember.findByPk(appMemberId, { attributes: ['id', 'role'] });

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return getAppMemberScopedRole(appMember, groupId);
}

async function getUserAppRole(userId: string, appId: number, groupId?: number): Promise<AppRole> {
  const appMember = await AppMember.findOne({
    attributes: ['id', 'role'],
    where: {
      AppId: appId,
      UserId: userId,
    },
  });

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  return getAppMemberScopedRole(appMember, groupId);
}

async function getUserOrganizationRole(
  userId: string,
  organizationId: string,
): Promise<PredefinedOrganizationRole> {
  const organizationMember = await OrganizationMember.findOne({
    attributes: ['role'],
    where: {
      UserId: userId,
      OrganizationId: organizationId,
    },
  });

  if (!organizationMember) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  return organizationMember.role;
}

export async function checkUnauthenticatedAppPermissions({
  appId,
  context,
  requiredPermissions,
}: CheckAppPermissionsParams): Promise<void> {
  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaCondition(app != null, context, 404, 'App not found');

  if (!app.definition.security) {
    return;
  }

  assertKoaCondition(
    checkGuestAppPermissions(app.definition.security, requiredPermissions),
    context,
    403,
    'Guest does not have sufficient app permissions.',
  );
}

export async function checkAppMemberAppPermissions({
  appId,
  context,
  groupId,
  requiredPermissions,
}: CheckAppPermissionsParams): Promise<void> {
  const { user: authSubject } = context;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaCondition(app != null, context, 404, 'App not found');

  if (!app.definition.security) {
    return;
  }

  const appMember = await AppMember.findByPk(authSubject!.id, { attributes: ['id'] });

  assertKoaCondition(appMember != null, context, 403, 'App member not found');

  const appMemberAppRole = await getAppMemberAppRole(appMember.id, appId, groupId);

  assertKoaCondition(
    checkAppRoleAppPermissions(app.definition.security, appMemberAppRole, requiredPermissions),
    context,
    403,
    'App member does not have sufficient app permissions.',
  );
}

function checkOrganizationRoleAppPermissions(
  organizationRole: PredefinedOrganizationRole,
  requiredPermissions: CustomAppPermission[],
): boolean {
  if (!organizationRole) {
    return false;
  }

  const organizationRolePermissions = predefinedOrganizationRolePermissions[organizationRole];

  return requiredPermissions.every((p) => {
    let mappedPermission = appOrganizationPermissionMapping[p as AppPermission];

    if (!mappedPermission) {
      const customAppPermission = p as string;

      if (customAppPermission.startsWith('$resource')) {
        mappedPermission =
          appOrganizationPermissionMapping[
            (p as CustomAppResourcePermission).replace(/:[^:]*:/, ':all:') as AppPermission
          ];
      }
    }

    return organizationRolePermissions.includes(mappedPermission);
  });
}

export async function checkUserAppPermissions({
  appId,
  context,
  groupId,
  requiredPermissions,
}: CheckAppPermissionsParams): Promise<void> {
  const { user: authSubject } = context;

  const app = await App.findByPk(appId, { attributes: ['definition', 'OrganizationId'] });

  assertKoaCondition(app != null, context, 404, 'App not found');

  if (!app.definition.security) {
    return;
  }

  const userAppRole = await getUserAppRole(authSubject!.id, appId, groupId);

  const userOrganizationRole = await getUserOrganizationRole(authSubject!.id, app.OrganizationId);

  assertKoaCondition(
    checkAppRoleAppPermissions(app.definition.security, userAppRole, requiredPermissions) ||
      checkOrganizationRoleAppPermissions(userOrganizationRole, requiredPermissions),
    context,
    403,
    'User does not have sufficient app permissions.',
  );
}

export async function checkUserOrganizationPermissions({
  context,
  organizationId,
  requiredPermissions,
}: CheckOrganizationPermissionsParams): Promise<void> {
  const { user: authSubject } = context;

  assertKoaCondition(authSubject != null, context, 401);

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaCondition(organization != null, context, 404, 'Organization not found.');

  const organizationMember = await OrganizationMember.findOne({
    attributes: ['role'],
    where: {
      UserId: authSubject!.id,
      OrganizationId: organizationId,
    },
  });

  assertKoaCondition(
    organizationMember != null,
    context,
    403,
    'User is not a member of this organization.',
  );

  const userOrganizationRole = await getUserOrganizationRole(authSubject!.id, organizationId);

  assertKoaCondition(
    checkOrganizationRoleOrganizationPermissions(userOrganizationRole, requiredPermissions),
    context,
    403,
    'User does not have sufficient organization permissions.',
  );
}

export function checkAuthSubjectAppPermissions(params: CheckAppPermissionsParams): Promise<void> {
  const { client } = params.context;

  return client && 'app' in client
    ? checkAppMemberAppPermissions(params)
    : checkUserAppPermissions(params);
}

export function checkAppPermissions(params: CheckAppPermissionsParams): Promise<void> {
  const { user: authSubject } = params.context;

  if (!authSubject) {
    return checkUnauthenticatedAppPermissions(params);
  }

  return checkAuthSubjectAppPermissions(params);
}
