import {
  getResourceDefinition,
  throwKoaError,
  type VerifyResourceActionPermissionParams,
} from '@appsemble/node-utils';
import { checkAppRole, Permission, TeamRole } from '@appsemble/utils';
import { Op, type WhereOptions } from 'sequelize';

import { AppMember, Organization, Team, TeamMember } from '../models/index.js';

const specialRoles = new Set([
  '$author',
  '$public',
  '$none',
  ...Object.values(TeamRole).map((r) => `$team:${r}`),
]);

export async function verifyResourceActionPermission({
  action,
  app,
  context,
  ctx,
  options: { checkRole },
  resourceType,
}: VerifyResourceActionPermissionParams): Promise<Record<string, any>> {
  const view = context.queryParams?.view;

  const resourceDefinition = getResourceDefinition(app, resourceType, ctx, view);

  const {
    query: { $team },
    user,
    users,
  } = context;

  if ('studio' in users || 'cli' in users) {
    await checkRole({
      context,
      app,
      permissions:
        action === 'count' || action === 'get' || action === 'query'
          ? Permission.ReadResources
          : Permission.ManageResources,
    });
    return;
  }

  const roles =
    (view
      ? resourceDefinition.views[view].roles
      : resourceDefinition[action]?.roles ?? resourceDefinition.roles) || [];

  if (!roles?.length && app.definition.roles?.length) {
    roles.push(...app.definition.roles);
  }

  const functionalRoles = roles.filter((r) => specialRoles.has(r));
  const appRoles = roles.filter((r) => !specialRoles.has(r));
  const isPublic = functionalRoles.includes('$public');
  const isNone = functionalRoles.includes('$none');

  if ($team && !functionalRoles.includes(`$team:${$team}`)) {
    functionalRoles.push(`$team:${$team}`);
  }

  if (!functionalRoles.length && !appRoles.length) {
    throwKoaError(ctx, 403, 'This action is private.');
  }

  if (isPublic && action !== 'count') {
    return;
  }

  if (isNone && !user) {
    return;
  }

  if (!isPublic && !user && (appRoles.length || functionalRoles.length)) {
    throwKoaError(ctx, 401, 'User is not logged in.');
  }

  const result: WhereOptions[] = [];

  if (functionalRoles.includes('$author') && user && action !== 'create') {
    result.push({ AuthorId: user.id });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Member}`) && user) {
    const appMember = await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } });
    const teamIds = (
      await Team.findAll({
        where: { AppId: app.id },
        include: [{ model: TeamMember, where: { AppMemberId: appMember.id } }],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const userIds = (
      await TeamMember.findAll({
        where: { TeamId: teamIds },
        include: [{ model: AppMember, attributes: ['UserId'] }],
      })
    ).map((tm) => tm.AppMember.UserId);
    result.push({ AuthorId: { [Op.in]: userIds } });
  }

  if (functionalRoles.includes(`$team:${TeamRole.Manager}`) && user) {
    const appMember = await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } });
    const teamIds = (
      await Team.findAll({
        where: { AppId: app.id },
        include: [
          { model: TeamMember, where: { AppMemberId: appMember.id, role: TeamRole.Manager } },
        ],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const userIds = (
      await TeamMember.findAll({
        where: { TeamId: teamIds },
        include: [{ model: AppMember, attributes: ['UserId'] }],
      })
    ).map((tm) => tm.AppMember.UserId);
    result.push({ AuthorId: { [Op.in]: userIds } });
  }

  if (app.definition.security && !isPublic) {
    const member = await AppMember.findOne({
      where: {
        AppId: app.id,
        UserId: user.id,
      },
    });
    const { policy = 'everyone', role: defaultRole } = app.definition.security.default;
    let role: string;

    if (member) {
      ({ role } = member);
    } else {
      const organization = await Organization.findOne({
        where: {
          id: app.OrganizationId,
        },
      });

      switch (policy) {
        case 'everyone':
          role = defaultRole;
          break;

        case 'organization':
          if (!(await organization.$has('User', user.id))) {
            throwKoaError(ctx, 403, 'User is not a member of the app.');
          }

          role = defaultRole;
          break;

        case 'invite':
          throwKoaError(ctx, 403, 'User is not a member of the app.');
          break;

        default:
          role = null;
      }
    }

    // Team roles are checked separately
    // XXX unify this logic?
    if (
      !appRoles.some((r) => checkAppRole(app.definition.security, r, role, null)) &&
      !result.length
    ) {
      throwKoaError(ctx, 403, 'User does not have sufficient permissions.');
    }
  }

  if (result.length === 0) {
    return;
  }

  return result.length === 1 ? result[0] : { [Op.or]: result };
}
