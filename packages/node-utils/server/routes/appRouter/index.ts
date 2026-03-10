import { createRequire } from 'node:module';
import { dirname } from 'node:path';

import { faVersion, type Options, tinyRouter } from '@appsemble/node-utils';
import { noop, partialNormalized, partialSemver } from '@appsemble/utils';
import { type Middleware } from 'koa';
import mount from 'koa-mount';
import serve from 'koa-static';

import { createBlockAssetHandler } from './blockAssetHandler.js';
import { createBlockCssHandler } from './blockCssHandler.js';
import { createBulmaHandler } from './bulmaHandler.js';
import { createCssHandler } from './cssHandler.js';
import { createIconHandler } from './iconHandler.js';
import { createIndexHandler } from './indexHandler.js';
import { createManifestHandler } from './manifestHandler.js';
import { createReadmeHandler } from './readmeHandler.js';
import { createRobotsHandler } from './robotsHandler.js';
import { createScreenshotHandler } from './screenshotHandler.js';
import { createSecurityHandler } from './securityHandler.js';
import { createServiceWorkerHandler } from './serviceWorkerHandler.js';
import { createStaticHandler } from './staticHandler.js';

const require = createRequire(import.meta.url);

const blockName = `(?<name>@${partialNormalized.source}/${partialNormalized.source})`;

export function createAppRouter(options: Options): Middleware {
  return tinyRouter([
    {
      route: '/manifest.json',
      get: createManifestHandler(options),
    },
    {
      route: '/.well-known/security.txt',
      get: createSecurityHandler(options),
    },
    {
      route: '/robots.txt',
      get: createRobotsHandler(options),
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
      route: /^\/readmes\/(?<id>\d+)\.md$/,
      get: createReadmeHandler(options),
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
        `/fa/${faVersion}`,
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
