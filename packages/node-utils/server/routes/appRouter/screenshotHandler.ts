import { type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createScreenshotHandler({ getApp, getAppScreenshots }: Options): Middleware {
  return async (ctx: Context) => {
    const { id } = ctx.params;

    const app = await getApp({ context: ctx });

    if (!app) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        message: 'App not found',
        error: 'Not Found',
      };
      ctx.throw();
    }

    const appScreenshots = await getAppScreenshots({ app, context: ctx });
    const appScreenshot = appScreenshots.find(
      (screenshot) => screenshot.id === Number.parseInt(id),
    );

    if (!appScreenshot) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        message: 'Screenshot not found',
        error: 'Not Found',
      };
      ctx.throw();
    }

    const { mime, screenshot } = appScreenshot;

    ctx.type = mime;
    ctx.body = screenshot;
  };
}
