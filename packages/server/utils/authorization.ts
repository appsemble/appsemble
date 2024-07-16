import { assertKoaError } from '@appsemble/node-utils';
import {
  type AppPermission,
  organizationMemberRoles,
  type OrganizationPermission,
  teamMemberRoles,
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

export async function checkAppMemberAppPermissions(
  ctx: Context,
  appId: number,
  permissions: AppPermission[],
): Promise<AppMember> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMember = await AppMember.findByPk(authSubject.id);

  const appMemberRoleDefinition = app.definition.security?.roles[appMember.role];

  assertKoaError(
    !permissions.every((p) => appMemberRoleDefinition.permissions.includes(p)),
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
  permissions: AppPermission[],
): Promise<AppMember> {
  const { user: authSubject } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMember = await AppMember.findOne({
    where: {
      UserId: authSubject.id,
      AppId: appId,
    },
  });

  assertKoaError(!appMember, ctx, 403, 'User is not a member of this app.');

  const appMemberRole = app.definition.security?.roles[appMember.role];

  assertKoaError(
    !permissions.every((p) => appMemberRole.permissions.includes(p)),
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

  const team = await Team.findByPk(teamId, { attributes: ['id'] });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  const appMember = await AppMember.findOne({
    attributes: ['id'],
    where: {
      UserId: authSubject.id,
      AppId: team.AppId,
    },
  });

  assertKoaError(
    !appMember,
    ctx,
    403,
    'User is not a member of the app that this team belongs to.',
  );

  const teamMember = await TeamMember.findOne({
    where: {
      TeamId: teamId,
      AppMemberId: appMember.id,
    },
  });

  assertKoaError(!teamMember, ctx, 403, 'User is not a member of this team.');

  const teamMemberRole = teamMemberRoles[teamMember.role];

  assertKoaError(
    !permissions.every((p) => teamMemberRole.includes(p)),
    ctx,
    403,
    'User does not have sufficient team permissions.',
  );

  return teamMember;
}

export function checkAuthSubjectAppPermissions(
  ctx: Context,
  appId: number,
  permissions: AppPermission[],
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
