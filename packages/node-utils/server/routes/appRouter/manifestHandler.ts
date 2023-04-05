import { baseTheme, normalize } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';
import { extension } from 'mime-types';

import { Options } from '../../types.js';

const iconSizes = [48, 144, 192, 512];

export function createManifestHandler({ getApp, getAppScreenshots }: Options): Middleware {
  return async (ctx: Context) => {
    const app = await getApp({ context: ctx });

    if (!app) {
      throw notFound('App not found');
    }

    const { defaultPage, description, name, theme = baseTheme } = app.definition;
    const { themeColor = '#ffffff', splashColor = themeColor } = theme;

    const appScreenshots = await getAppScreenshots({ app, context: ctx });

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
      screenshots: appScreenshots.map(({ height, id, mime, width }) => ({
        sizes: `${width}x${height}`,
        src: `/screenshots/${id}.${extension(mime)}`,
        type: mime,
      })),
      short_name: name,
      start_url: `/${normalize(defaultPage)}`,
      theme_color: themeColor,
    };
    ctx.type = 'application/manifest+json';
  };
}
