import {
  type AppPermission,
  type AppRole,
  checkAppRoleAppPermissions,
  checkGuestAppPermissions,
  type CustomAppPermission,
  type CustomAppResourcePermission,
} from '@appsemble/lang-sdk';
import { appWideGroupId, assertKoaCondition } from '@appsemble/node-utils';
import {
  appOrganizationPermissionMapping,
  type OrganizationPermission,
  type PredefinedOrganizationRole,
  predefinedOrganizationRolePermissions,
} from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  App,
  type AppMember,
  getAppDB,
  Organization,
  OrganizationMember,
} from '../models/index.js';

interface CheckAppPermissionsParams {
  context: Context;
  appId: number;
  groupId?: number | number[] | null;
  requiredPermissions: CustomAppPermission[];
}

interface CheckOrganizationPermissionsParams {
  context: Context;
  organizationId: string;
  requiredPermissions: OrganizationPermission[];
}

// Normalize a `groupId` argument to the list of group scopes to check. An
// absent or empty selection falls back to the app-wide scope, so callers that
// pass no group get a single app-wide permission check.
function normalizeGroupIds(groupId?: number | number[] | null): number[] {
  const ids = groupId == null ? [] : [groupId].flat();
  return ids.length ? ids : [appWideGroupId];
}

// Resolve the app member's roles for each selected group scope. Returns one
// role set per requested group, in the same order. The app-wide scope
// (`appWideGroupId`) resolves to the member's app-wide roles; a concrete group
// resolves to the member's role in that group (empty when not a member). All
// group memberships are fetched in a single query.
async function getAppMemberScopedRoles(
  appMember: AppMember | null,
  appId: number,
  groupId?: number | number[] | null,
): Promise<AppRole[][]> {
  const ids = normalizeGroupIds(groupId);

  if (!appMember) {
    return ids.map(() => []);
  }

  const concreteGroupIds = ids.filter((id) => id > 0);
  const groupMembers = concreteGroupIds.length
    ? await (
        await getAppDB(appId)
      ).GroupMember.findAll({
        attributes: ['GroupId', 'role'],
        where: { AppMemberId: appMember.id, GroupId: { [Op.in]: concreteGroupIds } },
      })
    : [];

  return ids.map((id) =>
    id > 0
      ? groupMembers.filter((member) => member.GroupId === id).map((member) => member.role)
      : appMember.roles,
  );
}

async function getAppMemberAppRoles(
  appMemberId: string,
  appId: number,
  groupId?: number | number[] | null,
): Promise<AppRole[][]> {
  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(appMemberId, { attributes: ['id', 'role'] });

  return getAppMemberScopedRoles(appMember, appId, groupId);
}

async function getUserAppRoles(
  userId: string,
  appId: number,
  groupId?: number | number[] | null,
): Promise<AppRole[][]> {
  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findOne({
    attributes: ['id', 'role'],
    where: { userId },
  });

  return getAppMemberScopedRoles(appMember, appId, groupId);
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
  const { AppMember } = await getAppDB(appId);

  const { user: authSubject } = context;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaCondition(app != null, context, 404, 'App not found');

  const { security } = app.definition;
  if (!security) {
    return;
  }

  const appMember = await AppMember.findByPk(authSubject!.id, { attributes: ['id', 'role'] });

  assertKoaCondition(appMember != null, context, 403, 'App member not found');

  const appMemberAppRoles = await getAppMemberAppRoles(appMember.id, appId, groupId);

  assertKoaCondition(
    appMemberAppRoles.every((roles) =>
      checkAppRoleAppPermissions(security, roles, requiredPermissions),
    ),
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

  const { security } = app.definition;
  if (!security) {
    return;
  }

  assertKoaCondition(authSubject != null, context, 401);

  const userAppRoles = await getUserAppRoles(authSubject.id, appId, groupId);

  const userOrganizationRole = await getUserOrganizationRole(authSubject.id, app.OrganizationId);

  assertKoaCondition(
    userAppRoles.every((roles) =>
      checkAppRoleAppPermissions(security, roles, requiredPermissions),
    ) || checkOrganizationRoleAppPermissions(userOrganizationRole, requiredPermissions),
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

async function getAppMemberPermittedGroups({
  appId,
  context,
  groupId,
  requiredPermissions,
}: CheckAppPermissionsParams): Promise<number[]> {
  const ids = normalizeGroupIds(groupId);

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaCondition(app != null, context, 404, 'App not found');

  const { security } = app.definition;
  if (!security) {
    return ids;
  }

  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(context.user!.id, { attributes: ['id', 'role'] });

  if (!appMember) {
    return [];
  }

  const roleSets = await getAppMemberScopedRoles(appMember, appId, groupId);

  return ids.filter((id, index) =>
    checkAppRoleAppPermissions(security, roleSets[index], requiredPermissions),
  );
}

/**
 * Resolve which of the selected groups the current app member may act in.
 *
 * Unlike {@link checkAppPermissions}, this does not throw when some groups are
 * not permitted; it returns the subset of the normalized `groupId` scopes for
 * which the app member holds the required permissions. List-style controllers
 * use this to filter their results to the groups the member is allowed to see.
 *
 * Group filtering only applies to in-app requests made by app members. Guests,
 * Studio users, and the CLI are authorized separately, so they resolve to an
 * empty set and fall back to the regular permission check.
 *
 * @param params The permission check parameters.
 * @returns The permitted subset of the normalized group scopes.
 */
export function getPermittedGroups(params: CheckAppPermissionsParams): Promise<number[]> {
  const { user: authSubject, client } = params.context;

  if (authSubject && client && 'app' in client) {
    return getAppMemberPermittedGroups(params);
  }

  return Promise.resolve([]);
}
