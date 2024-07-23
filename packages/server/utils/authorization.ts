import { assertKoaError } from "@appsemble/node-utils";
import {
  appMemberRoles,
  appOrganizationPermissionMapping,
  type AppPermission,
  organizationMemberRoles,
  OrganizationPermission,
  teamMemberRoles, teamOrganizationPermissionMapping,
  type TeamPermission
} from "@appsemble/utils";
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
} from '../models/index.js';
import { AppResourceActionPermission, CustomAppPermission, ResourceAction } from "@appsemble/types";

export async function checkAppMemberAppPermissions(
  ctx: Context,
  appId: number,
  permissions: CustomAppPermission[],
): Promise<AppMember> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMember = await AppMember.findByPk(authSubject.id);

  const appMemberRoleDefinition = app.definition.security?.roles[appMember.role];

  const rolePermissions = appMemberRoleDefinition.permissions?.length
    ? appMemberRoleDefinition.permissions
    : appMemberRoleDefinition.inherits?.length
      ? appMemberRoleDefinition.inherits.flatMap(
        (inheritedRole) => app.definition.security?.roles[inheritedRole].permissions,
      )
      : appMemberRoles.Member;

  assertKoaError(
    !permissions.every((p) => rolePermissions.includes(p)),
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

  const organizationMemberRole = organizationMemberRoles[organizationMember.role];

  assertKoaError(
    !permissions.every((p) => organizationMemberRole.includes(p)),
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

  const appMember = await AppMember.findOne({
    where: {
      AppId: appId,
      UserId: authSubject.id,
    },
  });

  let appRolePermissions: CustomAppPermission[] = [];
  if (appMember) {
    const appMemberRoleDefinition = app.definition.security?.roles[appMember.role];

    appRolePermissions = appMemberRoleDefinition.permissions?.length
      ? appMemberRoleDefinition.permissions
      : appMemberRoleDefinition.inherits?.length
        ? appMemberRoleDefinition.inherits.flatMap(
          (inheritedRole) => app.definition.security?.roles[inheritedRole].permissions,
        )
        : appMemberRoles.Member;
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
      (p) => {
        if (appRolePermissions.includes(p)) {
          return true;
        }

        const mappedPermission = appOrganizationPermissionMapping[p as AppPermission];

        if (mappedPermission) {
          return organizationRolePermissions.includes(mappedPermission);
        } else {
          const permissionString = String(p) as AppResourceActionPermission;
          const permissionType = permissionString.substring(1, permissionString.indexOf(':'));
          switch (permissionType) {
            case 'resource':
              const permissionAction = permissionString.substring(permissionString.lastIndexOf(':') + 1) as ResourceAction;
              const organizationPermissionKey= `${permissionAction[0].toUpperCase()}${permissionAction.substring(1)}AppResources` as keyof typeof OrganizationPermission;
              return organizationRolePermissions.includes(OrganizationPermission[organizationPermissionKey]);
          }
        }
      }
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
