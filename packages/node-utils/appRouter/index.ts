import { partialNormalized, partialSemver } from '@appsemble/utils';
import { Middleware } from 'koa';

import { tinyRouter } from '../tinyRouter.js';
import { AppRouterOptions } from '../types.js';
import { createBlockAssetHandler } from './blockAssetHandler.js';
import { createIconHandler } from './iconHandler.js';
import { createManifestHandler } from './manifestHandler.js';
import { createRobotsHandler } from './robotsHandler.js';
import { createScreenshotHandler } from './screenshotHandler.js';
import { createServiceWorkerHandler } from './serviceWorkerHandler.js';

const blockName = `(?<name>@${partialNormalized.source}/${partialNormalized.source})`;

export function createAppRouter(options: AppRouterOptions): Middleware {
  return tinyRouter([
    {
      route: '/manifest.json',
      get: createManifestHandler(options),
    },
    {
      route: '/robots.txt',
      get: createRobotsHandler,
    },
    {
      route: '/service-worker.js',
      get: createServiceWorkerHandler(options),
    },
    {
      route: new RegExp(
        `^/api/blocks/${blockName}/versions/(?<version>${partialSemver.source})/(?<filename>.+)$`,
      ),
      get: createBlockAssetHandler(options),
    },
    {
      route: /^\/icon-(?<size>\d+)\.png$/,
      get: createIconHandler(options),
    },
    {
      route: /^\/screenshots\/(?<id>\d+)\.(?<ext>[a-z]+)$/,
      get: createScreenshotHandler(options),
    },
  ]);
}
