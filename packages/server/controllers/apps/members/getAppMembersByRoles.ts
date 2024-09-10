import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember, User } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function getAppMembersByRoles(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { roles },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  const supportedAppRoles = Object.keys(app.definition.security.roles);
  const passedRolesAreSupported = roles.every((role) => supportedAppRoles.includes(role));

  assertKoaError(passedRolesAreSupported, ctx, 400, 'Unsupported role in filter!');

  const rolesFilter =
    Array.isArray(roles) && roles.length > 0 && passedRolesAreSupported
      ? roles
      : supportedAppRoles.filter((role) => role !== app.definition.security.default.role);

  assertKoaError(!app, ctx, 404, 'App not found');

  if (!app.demoMode) {
    await checkRole(ctx, app.OrganizationId, Permission.ReadAppAccounts);
  }

  const appMembersWithUser = await AppMember.findAll({
    attributes: {
      exclude: ['picture'],
    },
    where: {
      AppId: appId,
      role: {
        [Op.in]: rolesFilter,
      },
    },
    include: [User],
  });

  ctx.body = appMembersWithUser.map((member) => ({
    userId: member.UserId,
    memberId: member.id,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
    properties: member.properties,
  }));
}
