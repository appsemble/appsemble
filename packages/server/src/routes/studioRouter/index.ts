import { noop } from '@appsemble/utils';

import { tinyRouter } from '../../middleware/tinyRouter';
import { staticHandler } from '../static';
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
    route: /^\/icon-(?<size>\d+)\.png$/,
    get: iconHandler,
  },
  {
    route: /(^|\/)\.well-known(\/|$)/,
    any: noop,
  },
  {
    route: '/index.html',
    get: indexHandler,
  },
  {
    route: /\.[a-z]\w*$/i,
    any: staticHandler('studio'),
  },
  {
    route: /.*/,
    get: indexHandler,
  },
]);
