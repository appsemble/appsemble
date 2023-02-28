import { noop } from '@appsemble/utils';

import { tinyRouter } from '../../../node-utils/tinyRouter.js';
import { staticHandler } from '../static.js';
import { faviconHandler } from './faviconHandler.js';
import { iconHandler } from './iconHandler.js';
import { indexHandler } from './indexHandler.js';
import { tokenHandler } from './tokenHandler.js';

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
