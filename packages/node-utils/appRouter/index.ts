import { partialNormalized, partialSemver } from '@appsemble/utils';
import { Middleware } from 'koa';

import { tinyRouter } from '../tinyRouter.js';
import { AppRouterOptions } from '../types.js';
import { createBlockAssetHandler } from './blockAssetHandler.js';
import { createManifestHandler } from './manifestHandler.js';

const blockName = `(?<name>@${partialNormalized.source}/${partialNormalized.source})`;

export function createAppRouter(options: AppRouterOptions): Middleware {
  return tinyRouter([
    {
      route: '/manifest.json',
      get: createManifestHandler(options),
    },
    {
      route: new RegExp(
        `^/api/blocks/${blockName}/versions/(?<version>${partialSemver.source})/(?<filename>.+)$`,
      ),
      get: createBlockAssetHandler(options),
    },
  ]);
}
