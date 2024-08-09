import {
  getResourceDefinition,
  throwKoaError,
  type VerifyResourceActionPermissionParams,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import { Op, type WhereOptions } from 'sequelize';

import { AppMember, Group, GroupMember, Organization } from '../models/index.js';

const specialRoles = new Set(['$author', '$public', '$none', '$group:member', '$group:manager']);

export async function verifyResourceActionPermission({
  action,
  app,
  context,
  ctx,
  options: { checkUserOrganizationPermissions },
  resourceType,
}: VerifyResourceActionPermissionParams): Promise<Record<string, any>> {
  const view = context.queryParams?.view;

  const resourceDefinition = getResourceDefinition(app, resourceType, ctx, view);

  const {
    query: { $group },
    user,
    users,
  } = context;

  if ('studio' in users || 'cli' in users) {
    await checkUserOrganizationPermissions({
      context,
      app,
      permissions:
        action === 'count' || action === 'get' || action === 'query'
          ? [OrganizationPermission.QueryAppResources]
          : [OrganizationPermission.UpdateAppResources, OrganizationPermission.DeleteAppResources],
    });
    return;
  }

  const roles =
    (view
      ? resourceDefinition.views[view].roles
      : resourceDefinition[action]?.roles ?? resourceDefinition.roles) || [];

  if (!roles?.length && Object.keys(app.definition.security?.roles).length) {
    roles.push(...Object.keys(app.definition.security?.roles));
  }

  const functionalRoles = roles.filter((r) => specialRoles.has(r));
  const appRoles = roles.filter((r) => !specialRoles.has(r));
  const isPublic = functionalRoles.includes('$public');
  const isNone = functionalRoles.includes('$none');

  if ($group && !functionalRoles.includes(`$group:${$group}`)) {
    functionalRoles.push(`$group:${$group}`);
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

  const member = user
    ? await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } })
    : null;

  if (functionalRoles.includes('$author') && member && action !== 'create') {
    result.push({ AuthorId: member.id });
  }

  if (functionalRoles.includes('$group:member') && user) {
    const groupIds = (
      await Group.findAll({
        where: { AppId: app.id },
        include: [{ model: GroupMember, where: { AppMemberId: member.id } }],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const appMemberIds = (
      await GroupMember.findAll({
        where: { GroupId: groupIds },
        attributes: ['AppMemberId'],
      })
    ).map((tm) => tm.AppMemberId);
    result.push({ AuthorId: { [Op.in]: appMemberIds } });
  }

  if (functionalRoles.includes('$group:manager') && user) {
    const groupIds = (
      await Group.findAll({
        where: { AppId: app.id },
        include: [{ model: GroupMember, where: { AppMemberId: member.id, role: 'Manager' } }],
        attributes: ['id'],
      })
    ).map((t) => t.id);

    const appMemberIds = (
      await GroupMember.findAll({
        where: { GroupId: groupIds },
        attributes: ['AppMemberId'],
      })
    ).map((tm) => tm.AppMemberId);
    result.push({ AuthorId: { [Op.in]: appMemberIds } });
  }

  if (app.definition.security && !isPublic) {
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

    // Group roles are checked separately
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
