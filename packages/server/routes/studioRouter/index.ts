import { tinyRouter } from '@appsemble/node-utils';
import { noop } from '@appsemble/utils';
import { type Middleware } from 'koa';

import { appsTokenHandler } from './appsTokenHandler.js';
import { faviconHandler } from './faviconHandler.js';
import { iconHandler } from './iconHandler.js';
import { indexHandler } from './indexHandler.js';
import { mainTokenHandler } from './mainTokenHandler.js';
import { securitytxtHandler } from './securitytxtHandler.js';
import { staticHandler } from '../static.js';

export const studioRouter: Middleware = tinyRouter([
  {
    route: '/auth/oauth2/token',
    post: mainTokenHandler,
  },
  {
    route: /\/apps\/\d+\/auth\/oauth2\/token/,
    post: appsTokenHandler,
  },
  {
    route: '/favicon.ico',
    get: faviconHandler,
  },
  {
    route: '/.well-known/security.txt',
    get: securitytxtHandler,
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
