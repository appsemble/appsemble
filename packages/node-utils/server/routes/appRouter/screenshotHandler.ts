import { type Options } from '@appsemble/node-utils';
import { notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

export function createScreenshotHandler({ getApp, getAppScreenshots }: Options): Middleware {
  return async (ctx: Context) => {
    const { id } = ctx.params;

    const app = await getApp({ context: ctx });

    if (!app) {
      throw notFound('App not found');
    }

    const appScreenshots = await getAppScreenshots({ app, context: ctx });
    const appScreenshot = appScreenshots.find(
      (screenshot) => screenshot.id === Number.parseInt(id),
    );

    if (!appScreenshot) {
      throw notFound('Screenshot not found');
    }

    const { mime, screenshot } = appScreenshot;

    ctx.type = mime;
    ctx.body = screenshot;
  };
}
