import { baseTheme, normalize } from '@appsemble/utils';

import type { KoaContext } from '../../types';
import { getApp } from '../../utils/app';

const iconSizes = [48, 144, 192, 512];

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 *
 * @param ctx - The Koa context.
 */
export async function manifestHandler(ctx: KoaContext): Promise<void> {
  const app = await getApp(ctx, {
    attributes: ['definition'],
    raw: true,
  });
  const { defaultPage, description, name, theme = baseTheme } = app.definition;
  const { themeColor = '#ffffff', splashColor = themeColor } = theme;

  ctx.body = {
    background_color: splashColor,
    description,
    display: 'standalone',
    icons: iconSizes.map((size) => ({
      src: `/icon-${size}.png`,
      type: 'image/png',
      sizes: `${size}x${size}`,
    })),
    name,
    orientation: 'any',
    scope: '/',
    short_name: name,
    start_url: `/${normalize(defaultPage)}`,
    theme_color: themeColor,
  };
  ctx.type = 'application/manifest+json';
}
