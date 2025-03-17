import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { addDays, startOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppEmailQuotaLog } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function getAppEmailQuota(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.ReadAppSettings],
  });

  if (!argv.enableAppEmailQuota) {
    ctx.response.status = 200;
    ctx.response.body = null;
    return;
  }

  const todayStartUTC = zonedTimeToUtc(startOfDay(new Date()), 'UTC');
  const used = await AppEmailQuotaLog.count({
    where: {
      AppId: appId,
      created: {
        [Op.gte]: todayStartUTC,
      },
    },
  });

  const reset = addDays(todayStartUTC, 1);
  const limit = argv.dailyAppEmailQuota;
  ctx.response.status = 200;
  ctx.response.body = {
    used,
    limit,
    reset,
  };
}
