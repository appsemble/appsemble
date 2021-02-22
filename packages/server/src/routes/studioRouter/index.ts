import { tinyRouter } from '../../middleware/tinyRouter';
import { faviconHandler } from './faviconHandler';
import { iconHandler } from './iconHandler';
import { indexHandler } from './indexHandler';
import { tokenHandler } from './tokenHandler';

export const studioRouter = tinyRouter([
  {
    route: '/oauth2/token',
    post: tokenHandler,
  },
  {
    route: '/favicon.ico',
    get: faviconHandler,
  },
  {
    route: /^\/icon-(?<width>\d+)(x(?<height>\d+))?\.(?<format>png|tiff|webp)$/,
    get: iconHandler,
  },
  {
    route: /(^|\/)\.well-known(\/|$)/,
    any() {},
  },
  {
    route: /\.\w+$/,
    any() {},
  },
  {
    route: /.*/,
    get: indexHandler,
  },
]);
