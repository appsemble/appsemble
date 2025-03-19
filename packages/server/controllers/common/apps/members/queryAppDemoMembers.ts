import { assertKoaCondition } from '@appsemble/node-utils';
import { getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember } from '../../../../models/index.js';
import { getAppMemberInfo } from '../../../../utils/appMember.js';

export async function queryAppDemoMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { roles },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(app.demoMode, ctx, 401, 'App is not in demo mode');

  const supportedAppRoles = getAppRoles(app.definition.security);

  const passedRoles = roles ? roles.split(',') : [];

  if (passedRoles.length) {
    const passedRolesAreSupported = passedRoles.every((role) => supportedAppRoles.includes(role));

    assertKoaCondition(passedRolesAreSupported, ctx, 400, 'Unsupported role in filter!');
  }

  const appMembers = await AppMember.findAll({
    where: {
      AppId: appId,
      demo: true,
      ...(passedRoles.length ? { role: { [Op.in]: passedRoles } } : {}),
    },
  });

  ctx.body = appMembers.map((appMember) => getAppMemberInfo(appMember));
}
