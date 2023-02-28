import { baseTheme, normalize } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

const iconSizes = [48, 144, 192, 512];

export function createManifestHandler({ getApp, getAppScreenshots }: AppRouterOptions): Middleware {
  return async (ctx) => {
    const app = await getApp({ context: ctx });

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
      screenshots: getAppScreenshots({ app }),
      short_name: name,
      start_url: `/${normalize(defaultPage)}`,
      theme_color: themeColor,
    };
    ctx.type = 'application/manifest+json';
  };
}
