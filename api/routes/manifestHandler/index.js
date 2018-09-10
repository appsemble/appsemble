import Boom from 'boom';

import normalize from '@appsemble/utils/normalize';

import {
  select,
} from '../../utils/db';


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
  const {
    id,
  } = ctx.params;

  const apps = await select('App', { id });
  if (apps.length === 0) {
    throw Boom.notFound('App not found');
  }
  const [app] = apps;
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
