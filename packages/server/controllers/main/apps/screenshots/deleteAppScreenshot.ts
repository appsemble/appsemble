import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppScreenshot } from '../../../../models/index.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../utils/checkRole.js';

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
  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  assertKoaError(!app.AppScreenshots.length, ctx, 404, 'Screenshot not found');

  await app.AppScreenshots[0].destroy();
}
