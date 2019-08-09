import { baseTheme, normalize } from '@appsemble/utils';
import Boom from '@hapi/boom';

const iconSizes = [48, 144, 192, 512];

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function manifestHandler(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.db.models;

  const record = await App.findByPk(id, { raw: true });

  if (!record) {
    throw Boom.notFound('App not found');
  }

  const { path } = record;
  const { defaultPage, description, name, theme = { baseTheme } } = record.definition;
  const { themeColor = '#ffffff', splashColor = themeColor } = theme;

  ctx.body = {
    background_color: splashColor,
    description,
    display: 'standalone',
    icons: iconSizes.map(size => ({
      src: `/${id}/icon-${size}.png`,
      type: 'image/png',
      sizes: `${size}x${size}`,
    })),
    name,
    orientation: 'any',
    scope: `/${path}`,
    short_name: name,
    start_url: `/${path}/${normalize(defaultPage)}`,
    theme_color: themeColor,
  };
  ctx.type = 'application/manifest+json';
}
