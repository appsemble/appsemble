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

  const app = { ...record.definition, id };

  ctx.body = {
    background_color: '#ff8c7d',
    display: 'standalone',
    icons: iconSizes.map(size => ({
      src: `/${id}/icon-${size}.png`,
      type: 'image/png',
      sizes: `${size}x${size}`,
    })),
    name: app.name,
    orientation: 'any',
    short_name: app.name,
    start_url: `/${id}/${normalize(app.defaultPage)}`,
    theme_color: '#ff2f15',
  };
}
