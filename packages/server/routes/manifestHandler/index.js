import normalize from '@appsemble/utils/normalize';
import Boom from 'boom';

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
  const { defaultPage, description, name, theme = {} } = record.definition;
  const { themeColor = '#ffffff', backgroundColor = themeColor } = theme;

  ctx.body = {
    background_color: backgroundColor,
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
