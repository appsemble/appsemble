import { partialNormalized } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import tokenHandler from './tokenHandler';

export default tinyRouter([
  {
    route: '/oauth2/token',
    post: tokenHandler,
  },
  {
    route: '/favicon.ico',
    get: faviconHandler,
  },
  {
    route: /^\/icon-(?<width>\d+)(x(?<height>\d+))?\.(?<format>png|jpg|tiff|webp)$/,
    get: iconHandler,
  },
  {
    route: /(^|\/)\.well-known(\/|$)/,
    any() {},
  },
  {
    route: new RegExp(`^(/${partialNormalized.source})*`),
    get: indexHandler,
  },
]);
