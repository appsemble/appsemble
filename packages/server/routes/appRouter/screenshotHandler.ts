import { notFound } from '@hapi/boom';
import { type Context } from 'koa';

import { AppScreenshot } from '../../models/index.js';
import { getApp } from '../../utils/app.js';

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx The Koa context.
 */
export async function screenshotHandler(ctx: Context): Promise<void> {
  const { id } = ctx.params;

  const { app } = await getApp(ctx, {
    attributes: [],
    include: [{ model: AppScreenshot, attributes: ['screenshot'], where: { id } }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppScreenshots?.[0]) {
    throw notFound('Screenshot not found');
  }

  const [{ mime, screenshot }] = app.AppScreenshots;

  ctx.type = mime;
  ctx.body = screenshot;
}
