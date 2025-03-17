import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppScreenshot } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

export async function deleteAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, screenshotId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [
      { model: AppScreenshot, attributes: ['id'], where: { id: screenshotId }, required: false },
    ],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppScreenshots],
  });

  assertKoaCondition(!!app.AppScreenshots.length, ctx, 404, 'Screenshot not found');

  await app.AppScreenshots[0].destroy();
}
