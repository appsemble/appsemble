import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppScreenshot } from '../../../../models/index.js';

export async function getAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, screenshotId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['screenshot', 'mime'],
        model: AppScreenshot,
        required: false,
        where: { id: screenshotId },
      },
    ],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(
    app.AppScreenshots != null && app.AppScreenshots.length > 0,
    ctx,
    404,
    'Screenshot not found',
  );

  const [{ mime, screenshot }] = app.AppScreenshots;

  ctx.body = screenshot;
  ctx.type = mime;
}
