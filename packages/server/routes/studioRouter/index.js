import { partialNormalized } from '@appsemble/utils';

import tinyRouter from '../../middleware/tinyRouter';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import oauth2CallbackHandler from './oauth2CallbackHandler';
import oauth2ConnectHandler from './oauth2ConnectHandler';
import tokenHandler from './tokenHandler';

export default tinyRouter([
  {
    route: '/api/oauth2/token',
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
    route: /^\/connect\/(?<provider>[a-z]+)$/,
    get: oauth2ConnectHandler,
  },
  {
    route: /^\/connect\/(?<provider>[a-z]+)\/callback$/,
    get: oauth2CallbackHandler,
  },
  {
    route: new RegExp(`^(/${partialNormalized.source})*`),
    get: indexHandler,
  },
]);
