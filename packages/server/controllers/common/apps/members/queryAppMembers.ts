import { AppPermission, getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember } from '../../../../models/index.js';
import { getAppMemberInfo, parseMemberFilterQuery } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function queryAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { $filter: parsedFilter, roles, selectedGroupId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.QueryAppMembers],
    groupId: selectedGroupId,
  });

  const supportedAppRoles = getAppRoles(app.definition.security);

  const passedRoles = roles ? roles.split(',') : [];

  if (passedRoles.length) {
    const passedRolesAreSupported = passedRoles.every((role) => supportedAppRoles.includes(role));

    assertKoaCondition(passedRolesAreSupported, ctx, 400, 'Unsupported role in filter!');
  }

  const filter = parseMemberFilterQuery(parsedFilter ?? '');
  const commonFilters = {
    AppId: appId,
    demo: false,
    ...(passedRoles.length ? { role: { [Op.in]: passedRoles } } : {}),
  };

  const appMembers = await AppMember.findAll({
    where: {
      ...(parsedFilter ? { [Op.and]: [filter, commonFilters] } : commonFilters),
    },
    order: [['role', 'ASC']],
  });

  ctx.body = appMembers.map((appMember) => getAppMemberInfo(appMember));
}
