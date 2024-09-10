import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';
import { type File } from 'koas-body-parser';

import { App, AppScreenshot, transactional } from '../../../../models/index.js';
import { createAppScreenshots } from '../../../../utils/app.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function createAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { language, screenshots },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  const languageScreenshot = await AppScreenshot.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      ...(language ? { language } : {}),
    },
  });

  const languageScreenshots = screenshots.map((screenshot: File) => {
    const { filename } = screenshot;
    return {
      ...screenshot,
      filename: `${languageScreenshot ? language : 'unspecified'}-${filename}`,
    };
  });

  let result: AppScreenshot[] = [];
  await transactional(async (transaction) => {
    result = await createAppScreenshots(appId, languageScreenshots, transaction, ctx);
  });

  ctx.body = result.map((screenshot) => screenshot.id);
}
