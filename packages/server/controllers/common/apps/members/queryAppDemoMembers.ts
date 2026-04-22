import { getAppRoles } from '@appsemble/lang-sdk';
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

export async function queryAppDemoMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { $filter: parsedFilter, roles },
  } = ctx;
  const { AppMember } = await getAppDB(appId);
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(app.demoMode, ctx, 401, 'App is not in demo mode');

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
    demo: true,
    seed: false,
    ...(memberIds ? { id: { [Op.in]: memberIds } } : {}),
  };

  const appMembers = await AppMember.findAll({
    where: {
      ...(parsedFilter ? { [Op.and]: [filter, commonFilters] } : commonFilters),
    },
  });

  ctx.body = appMembers
    .filter((member) => !hasAppMemberRole(member, 'cron'))
    .sort(compareAppMembersByRoles)
    .map((appMember) => ({
      ...getAppMemberInfo(appId, appMember),
      role: appMember.role ?? undefined,
    }));
}
