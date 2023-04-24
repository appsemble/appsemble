import { baseTheme, normalize } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { type Context } from 'koa';
import { extension } from 'mime-types';

import { AppScreenshot } from '../../models/index.js';
import { getApp } from '../../utils/app.js';

const iconSizes = [48, 144, 192, 512];

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx The Koa context.
 */
export async function manifestHandler(ctx: Context): Promise<void> {
  const { app } = await getApp(ctx, {
    attributes: ['definition'],
    include: [{ model: AppScreenshot, attributes: ['width', 'height', 'id', 'mime'] }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const { defaultPage, description, name, theme = baseTheme } = app.definition;
  const { themeColor = '#ffffff', splashColor = themeColor } = theme;

  ctx.body = {
    background_color: splashColor,
    description,
    display: 'standalone',
    icons: iconSizes.flatMap((size) => [
      {
        src: `/icon-${size}.png`,
        type: 'image/png',
        sizes: `${size}x${size}`,
        purpose: 'any',
      },
      {
        src: `/icon-${size}.png?maskable=true`,
        type: 'image/png',
        sizes: `${size}x${size}`,
        purpose: 'maskable',
      },
    ]),
    name,
    orientation: 'any',
    scope: '/',
    screenshots: app.AppScreenshots?.map(({ height, id, mime, width }) => ({
      sizes: `${width}x${height}`,
      src: `/screenshots/${id}.${extension(mime)}`,
      type: mime,
    })),
    short_name: name,
    start_url: `/${normalize(defaultPage)}`,
    theme_color: themeColor,
  };
  ctx.type = 'application/manifest+json';
}
