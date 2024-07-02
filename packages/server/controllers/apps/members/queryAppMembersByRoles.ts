import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember } from '../../../models/index.js';
import { getAppMemberInfo } from '../../../utils/appMember.js';
import { checkAppMemberAppPermissions } from '../../../utils/authorization.js';

export async function queryAppMembersByRoles(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { roles },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const supportedAppRoles = Object.keys(app.definition.security.roles);

  const passedRoles = Array.isArray(roles) ? roles : [roles];

  const passedRolesAreSupported = passedRoles.every((role) => supportedAppRoles.includes(role));

  assertKoaError(passedRolesAreSupported, ctx, 400, 'Unsupported role in filter!');

  if (!app.demoMode) {
    await checkAppMemberAppPermissions(ctx, appId, [AppPermission.QueryAppMembers]);
  }

  const appMembers = await AppMember.findAll({
    attributes: {
      exclude: ['picture'],
    },
    where: {
      AppId: appId,
      role: {
        [Op.in]: passedRoles,
      },
    },
  });

  ctx.body = appMembers.map((appMember) => getAppMemberInfo(appMember));
}
