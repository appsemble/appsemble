import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission, getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember } from '../../../../models/index.js';
import { getAppMemberInfo } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function queryAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { demo, roles = [] },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  if (!app.demoMode) {
    await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.QueryAppMembers]);
  }

  const supportedAppRoles = getAppRoles(app.definition);

  const passedRoles = Array.isArray(roles) ? roles : [roles];

  if (passedRoles.length) {
    const passedRolesAreSupported = passedRoles.every((role) => supportedAppRoles.includes(role));

    assertKoaError(passedRolesAreSupported, ctx, 400, 'Unsupported role in filter!');
  }

  const appMembers = await AppMember.findAll({
    where: {
      AppId: appId,
      ...(demo === undefined ? {} : { demo }),
      ...(passedRoles.length ? { role: { [Op.in]: passedRoles } } : {}),
    },
  });

  ctx.body = appMembers.map((appMember) => getAppMemberInfo(appMember));
}
