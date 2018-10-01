import Boom from 'boom';

import normalize from '@appsemble/utils/normalize';

const iconSizes = [
  48,
  144,
  192,
  512,
];


/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function manifestHandler(ctx) {
  const { id } = ctx.params;
  const { App } = ctx.state.db;

  const record = await App.findById(id, { raw: true });

  if (!record) {
    throw Boom.notFound('App not found');
  }

  const {
    defaultPage,
    name,
    theme,
  } = record.definition;
  const {
    themeColor = '#ffffff',
    backgroundColor = themeColor,
  } = theme;

  ctx.body = {
    background_color: backgroundColor,
    display: 'standalone',
    icons: iconSizes.map(size => ({
      src: `/${id}/icon-${size}.png`,
      type: 'image/png',
      sizes: `${size}x${size}`,
    })),
    name,
    orientation: 'any',
    scope: `/${id}`,
    short_name: name,
    start_url: `/${id}/${normalize(defaultPage)}`,
    theme_color: themeColor,
  };
  ctx.type = 'application/manifest+json';
}
