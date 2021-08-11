import { dirname } from 'path';

import { noop, partialNormalized, partialSemver } from '@appsemble/utils';
import faPkg from '@fortawesome/fontawesome-free/package.json';
import mount from 'koa-mount';
import serve from 'koa-static';

import { tinyRouter } from '../../middleware/tinyRouter';
import { staticHandler } from '../static';
import { blockAssetHandler } from './blockAssetHandler';
import { blockCSSHandler } from './blockCSSHandler';
import { bulmaHandler } from './bulmaHandler';
import { cssHandler } from './cssHandler';
import { iconHandler } from './iconHandler';
import { indexHandler } from './indexHandler';
import { manifestHandler } from './manifestHandler';
import { robotsHandler } from './robotsHandler';
import { screenshotHandler } from './screenshotHandler';
import { serviceWorkerHandler } from './serviceWorkerHandler';

const blockName = `(?<name>@${partialNormalized.source}/${partialNormalized.source})`;

export const appRouter = tinyRouter([
  {
    route: '/manifest.json',
    get: manifestHandler,
  },
  {
    route: '/robots.txt',
    get: robotsHandler,
  },
  {
    route: '/service-worker.js',
    get: serviceWorkerHandler,
  },
  {
    route: /^\/icon-(?<size>\d+)\.png$/,
    get: iconHandler,
  },
  {
    route: /^\/screenshots\/(?<id>\d+)\.(?<ext>[a-z]+)$/,
    get: screenshotHandler,
  },
  {
    route: new RegExp(
      `^/api/blocks/${blockName}/versions/(?<version>${partialSemver.source})/(?<filename>.+)$`,
    ),
    get: blockAssetHandler,
  },
  {
    route: /^\/bulma/,
    get: bulmaHandler,
  },
  {
    route: /^\/fa\//,
    get: mount(
      `/fa/${faPkg.version}`,
      serve(dirname(require.resolve('@fortawesome/fontawesome-free/package.json'))),
    ),
  },
  {
    route: '/core.css',
    get: cssHandler('coreStyle'),
  },
  {
    route: '/shared.css',
    get: cssHandler('sharedStyle'),
  },
  {
    route: new RegExp(`^/${blockName}\\.css`),
    get: blockCSSHandler,
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
    any: staticHandler('app'),
  },
  {
    route: /.*/,
    get: indexHandler,
  },
]);
