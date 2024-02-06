import { assertKoaError, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createScreenshotHandler({ getApp, getAppScreenshots }: Options): Middleware {
  return async (ctx: Context) => {
    const { id } = ctx.params;

    const app = await getApp({ context: ctx });

    assertKoaError(!app, ctx, 404, 'App not found');

    const appScreenshots = await getAppScreenshots({ app, context: ctx });
    const appScreenshot = appScreenshots.find(
      (screenshot) => screenshot.id === Number.parseInt(id),
    );

    assertKoaError(!appScreenshot, ctx, 404, 'Screenshot not found');

    const { mime, screenshot } = appScreenshot;

    ctx.type = mime;
    ctx.body = screenshot;
  };
}
