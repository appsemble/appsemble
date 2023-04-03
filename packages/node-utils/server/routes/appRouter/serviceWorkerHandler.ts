import { readFile } from 'node:fs/promises';

import { getAppBlocks } from '@appsemble/utils';
import { Context, Middleware } from 'koa';

import { AppRouterOptions } from '../../types';

export function createServiceWorkerHandler({
  getApp,
  getBlocksAssetsPaths,
}: AppRouterOptions): Middleware {
  return async (ctx: Context) => {
    const production = process.env.NODE_ENV === 'production';

    const filename = production ? '/service-worker.js' : '/app/service-worker.js';

    const serviceWorker = await (production
      ? readFile(new URL('../../../../dist/app/service-worker.js', import.meta.url), 'utf8')
      : ctx.fs.promises.readFile(filename, 'utf8'));

    const app = await getApp({ context: ctx });

    ctx.assert(app, 404, 'App does not exist.');

    const identifiableBlocks = getAppBlocks(app.definition);
    const blocksAssetsPaths = await getBlocksAssetsPaths({ identifiableBlocks, context: ctx });

    ctx.body = `const blockAssets=${JSON.stringify(blocksAssetsPaths)};${serviceWorker}`;
    ctx.type = 'application/javascript';
  };
}
