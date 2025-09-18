import { readFile } from 'node:fs/promises';

import { getAppBlocks } from '@appsemble/lang-sdk';
import { assertKoaCondition, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createServiceWorkerHandler({ getApp, getBlocksAssetsPaths }: Options): Middleware {
  return async (ctx: Context) => {
    const production = process.env.NODE_ENV === 'production';

    const filename = production ? '/service-worker.js' : '/app/service-worker.js';

    const serviceWorker = await (production
      ? readFile(new URL('../../../../../dist/app/service-worker.js', import.meta.url), 'utf8')
      : ctx.fs.promises.readFile(filename, 'utf8'));

    const app = await getApp({
      context: ctx,
      query: { attributes: ['id', 'definition'] },
    });

    assertKoaCondition(app != null, ctx, 404, 'App does not exist.');

    const identifiableBlocks = getAppBlocks(app.definition);
    const blocksAssetsPaths = await getBlocksAssetsPaths({ identifiableBlocks, context: ctx });

    // App.version is a virtual column and comes from App.AppSnapshots
    ctx.body = `const appVersion = ${app.version};const blockAssets=${JSON.stringify(blocksAssetsPaths)};${serviceWorker}`;
    ctx.type = 'application/javascript';
  };
}
