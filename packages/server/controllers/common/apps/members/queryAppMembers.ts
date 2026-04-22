import { AppPermission, getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';
import {
  compareAppMembersByRoles,
  getAppMemberIdsByRoles,
  getAppMemberInfo,
  hasAppMemberRole,
  parseMemberFilterQuery,
} from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function queryAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { $filter: parsedFilter, roles, selectedGroupId },
  } = ctx;
  const { AppMember } = await getAppDB(appId);
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
  const passedRoles = roles ? roles.split(',').filter(Boolean) : [];

  if (passedRoles.length) {
    const passedRolesAreSupported = passedRoles.every((role) => supportedAppRoles.includes(role));

    assertKoaCondition(passedRolesAreSupported, ctx, 400, 'Unsupported role in filter!');
  }

  const memberIds = passedRoles.length ? await getAppMemberIdsByRoles(appId, passedRoles) : null;

  if (memberIds?.length === 0) {
    ctx.body = [];
    return;
  }

  const filter = parseMemberFilterQuery(parsedFilter ?? '');
  const commonFilters = {
    demo: false,
    ...(memberIds ? { id: { [Op.in]: memberIds } } : {}),
  };

  const appMembers = await AppMember.findAll({
    where: {
      ...(parsedFilter ? { [Op.and]: [filter, commonFilters] } : commonFilters),
    },
  });

  ctx.body = appMembers
    .filter((appMember) => !hasAppMemberRole(appMember, 'cron'))
    .sort(compareAppMembersByRoles)
    .map((appMember) => ({
      ...getAppMemberInfo(appId, appMember),
      role: appMember.role ?? undefined,
    }));
}
