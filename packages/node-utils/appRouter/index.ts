import { createRequire } from 'node:module';
import { dirname } from 'node:path';

import { noop, partialNormalized, partialSemver } from '@appsemble/utils';
import faPkg from '@fortawesome/fontawesome-free/package.json' assert { type: 'json' };
import { Middleware } from 'koa';
import mount from 'koa-mount';
import serve from 'koa-static';

import { tinyRouter } from '../tinyRouter.js';
import { AppRouterOptions } from '../types.js';
import { createBlockAssetHandler } from './blockAssetHandler.js';
import { createBlockCssHandler } from './blockCssHandler.js';
import { createBulmaHandler } from './bulmaHandler.js';
import { createCssHandler } from './cssHandler.js';
import { createIconHandler } from './iconHandler.js';
import { createIndexHandler } from './indexHandler.js';
import { createManifestHandler } from './manifestHandler.js';
import { createRobotsHandler } from './robotsHandler.js';
import { createScreenshotHandler } from './screenshotHandler.js';
import { createServiceWorkerHandler } from './serviceWorkerHandler.js';
import { createStaticHandler } from './staticHandler.js';

const require = createRequire(import.meta.url);

const blockName = `(?<name>@${partialNormalized.source}/${partialNormalized.source})`;

export function createAppRouter(options: AppRouterOptions): Middleware {
  return tinyRouter([
    {
      route: '/manifest.json',
      get: createManifestHandler(options),
    },
    {
      route: '/robots.txt',
      get: createRobotsHandler(),
    },
    {
      route: '/service-worker.js',
      get: createServiceWorkerHandler(options),
    },
    {
      route: /^\/icon-(?<size>\d+)\.png$/,
      get: createIconHandler(options),
    },
    {
      route: /^\/screenshots\/(?<id>\d+)\.(?<ext>[a-z]+)$/,
      get: createScreenshotHandler(options),
    },
    {
      route: new RegExp(
        `^/api/blocks/${blockName}/versions/(?<version>${partialSemver.source})/(?<filename>.+)$`,
      ),
      get: createBlockAssetHandler(options),
    },
    {
      route: /^\/bulma/,
      get: createBulmaHandler(options),
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
      get: createCssHandler('coreStyle', options),
    },
    {
      route: '/shared.css',
      get: createCssHandler('sharedStyle', options),
    },
    {
      route: new RegExp(`^/${blockName}\\.css`),
      get: createBlockCssHandler(options),
    },
    {
      route: /(^|\/)\.well-known(\/|$)/,
      any: noop,
    },
    {
      route: '/index.html',
      get: createIndexHandler(options),
    },
    {
      route: /\.[a-z]\w*$/i,
      any: createStaticHandler('app'),
    },
    {
      route: /.*/,
      get: createIndexHandler(options),
    },
  ]);
}
