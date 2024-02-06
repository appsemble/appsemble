import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { addDays, startOfDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App } from '../models/App.js';
import { AppEmailQuotaLog } from '../models/AppEmailQuotaLog.js';
import { argv } from '../utils/argv.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';

export async function getAppEmailQuota(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

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
