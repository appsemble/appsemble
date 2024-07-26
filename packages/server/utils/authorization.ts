import { assertKoaError } from '@appsemble/node-utils';
import {
  type CustomAppPermission,
  type CustomAppResourcePermission,
  type Security,
} from '@appsemble/types';
import {
  appMemberRoles,
  appOrganizationPermissionMapping,
  AppPermission,
  getEnumKeyByValue,
  type OrganizationMemberRole,
  organizationMemberRoles,
  type OrganizationPermission,
  teamMemberRoles,
  teamOrganizationPermissionMapping,
  type TeamPermission,
} from '@appsemble/utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
} from '../models/index.js';

function checkAppRoleAppPermissions(
  appSecurityDefinition: Security,
  appRole: string,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const appRoleDefinition = appSecurityDefinition.roles[appRole];

  const appRolePermissions = appRoleDefinition.permissions?.length
    ? appRoleDefinition.permissions
    : appRoleDefinition.inherits?.length
      ? appRoleDefinition.inherits.flatMap(
          (inheritedRole) => appSecurityDefinition.roles[inheritedRole].permissions,
        )
      : appMemberRoles.Member;

  return requiredPermissions.every((p) => {
    if (getEnumKeyByValue(AppPermission, p)) {
      return appRolePermissions.includes(p);
    }
    if (p.startsWith('$resource')) {
      const permissionAction = p.slice(p.lastIndexOf(':') + 1);
      return appRolePermissions.includes(`$resource:all:${permissionAction}` as AppPermission);
    }
  });
}

function checkOrganizationRoleAppPermissions(
  organizationRole: OrganizationMemberRole,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const organizationRolePermissions = organizationMemberRoles[organizationRole];

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

function checkOrganizationRoleOrganizationPermissions(
  organizationRole: OrganizationMemberRole,
  requiredPermissions: OrganizationPermission[],
): boolean {
  return requiredPermissions.every((p) => organizationMemberRoles[organizationRole].includes(p));
}

export async function checkAppMemberAppPermissions(
  ctx: Context,
  appId: number,
  permissions: CustomAppPermission[],
): Promise<AppMember> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.definition.security, ctx, 404, 'App does not have a security definition');

  const appMember = await AppMember.findByPk(authSubject.id);

  assertKoaError(
    !checkAppRoleAppPermissions(app.definition.security, appMember.role, permissions),
    ctx,
    403,
    'App member does not have sufficient app permissions.',
  );

  return appMember;
}

export async function checkAppMemberTeamPermissions(
  ctx: Context,
  teamId: number,
  permissions: TeamPermission[],
): Promise<TeamMember> {
  const { user: authSubject } = ctx;

  const team = await Team.findByPk(teamId, { attributes: ['id'] });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  const teamMember = await TeamMember.findOne({
    where: {
      TeamId: teamId,
      AppMemberId: authSubject.id,
    },
  });

  assertKoaError(!teamMember, ctx, 403, 'App member is not a member of this team.');

  const teamMemberRole = teamMemberRoles[teamMember.role];

  assertKoaError(
    !permissions.every((p) => teamMemberRole.includes(p)),
    ctx,
    403,
    'App member does not have sufficient team permissions.',
  );

  return teamMember;
}

export async function checkUserOrganizationPermissions(
  ctx: Context,
  organizationId: string,
  permissions: OrganizationPermission[],
): Promise<OrganizationMember> {
  const { user: authSubject } = ctx;

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaError(!organization, ctx, 403, 'Organization not found.');

  const organizationMember = await OrganizationMember.findOne({
    where: {
      OrganizationId: organizationId,
      UserId: authSubject.id,
    },
  });

  assertKoaError(!organizationMember, ctx, 403, 'User is not a member of this organization.');

  assertKoaError(
    !checkOrganizationRoleOrganizationPermissions(organizationMember.role, permissions),
    ctx,
    403,
    'User does not have sufficient organization permissions.',
  );

  return organizationMember;
}

export async function checkUserAppPermissions(
  ctx: Context,
  appId: number,
  permissions: CustomAppPermission[],
): Promise<AppMember> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition', 'OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.definition.security, ctx, 404, 'App does not have a security definition');

  const appMember = await AppMember.findOne({
    where: {
      AppId: appId,
      UserId: authSubject.id,
    },
  });

  const organizationMember = await OrganizationMember.findOne({
    where: {
      OrganizationId: app.OrganizationId,
      UserId: authSubject.id,
    },
  });

  assertKoaError(
    !(
      (appMember &&
        checkAppRoleAppPermissions(app.definition.security, appMember.role, permissions)) ||
      (organizationMember &&
        checkOrganizationRoleAppPermissions(organizationMember.role, permissions))
    ),
    ctx,
    403,
    'User does not have sufficient app permissions.',
  );

  return appMember;
}

export async function checkUserTeamPermissions(
  ctx: Context,
  teamId: number,
  permissions: TeamPermission[],
): Promise<TeamMember> {
  const { user: authSubject } = ctx;

  const team = await Team.findByPk(teamId, { attributes: ['id', 'AppId'] });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  const app = await App.findByPk(team.AppId, { attributes: ['definition', 'OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMember = await AppMember.findOne({
    attributes: ['id'],
    where: {
      UserId: authSubject.id,
      AppId: team.AppId,
    },
  });

  let teamMember;
  let teamMemberRolePermissions: TeamPermission[] = [];
  if (appMember) {
    teamMember = await TeamMember.findOne({
      where: {
        TeamId: teamId,
        AppMemberId: appMember.id,
      },
    });

    teamMemberRolePermissions = teamMemberRoles[teamMember.role];
  }

  const organizationMember = await OrganizationMember.findOne({
    where: {
      OrganizationId: app.OrganizationId,
      UserId: authSubject.id,
    },
  });

  let organizationRolePermissions: OrganizationPermission[] = [];
  if (organizationMember) {
    organizationRolePermissions = organizationMemberRoles[organizationMember.role];
  }

  assertKoaError(
    !permissions.every(
      (p) =>
        teamMemberRolePermissions.includes(p) ||
        organizationRolePermissions.includes(teamOrganizationPermissionMapping[p]),
    ),
    ctx,
    403,
    'User does not have sufficient team permissions.',
  );

  return teamMember;
}

export function checkAuthSubjectAppPermissions(
  ctx: Context,
  appId: number,
  permissions: CustomAppPermission[],
): Promise<AppMember> {
  const { client } = ctx;

  return client && 'app' in client
    ? checkAppMemberAppPermissions(ctx, appId, permissions)
    : checkUserAppPermissions(ctx, appId, permissions);
}

export function checkAuthSubjectTeamPermissions(
  ctx: Context,
  teamId: number,
  permissions: TeamPermission[],
): Promise<TeamMember> {
  const { client } = ctx;

  return client && 'app' in client
    ? checkAppMemberTeamPermissions(ctx, teamId, permissions)
    : checkUserTeamPermissions(ctx, teamId, permissions);
}
