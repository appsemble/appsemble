import { partialNormalized } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import oauth2CallbackHandler from './oauth2CallbackHandler';
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
    route: /^\/oauth2\/(?<provider>[a-z]+)$/,
    // By calling next, this handler delegates the request to grant instead of the index handler.
    get: (ctx, next) => next(),
  },
  {
    route: /^\/oauth2\/(?<provider>[a-z]+)\/callback$/,
    get: oauth2CallbackHandler,
  },
  {
    route: new RegExp(`^(/${partialNormalized.source})*`),
    get: indexHandler,
  },
]);
