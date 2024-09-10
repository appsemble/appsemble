import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppScreenshot } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';
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

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteAppScreenshots]);

  assertKoaError(!app.AppScreenshots.length, ctx, 404, 'Screenshot not found');

  await app.AppScreenshots[0].destroy();
}
