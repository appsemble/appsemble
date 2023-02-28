import { Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

export function createBlockAssetHandler({ getBlockAsset }: AppRouterOptions): Middleware {
  return async (ctx) => {
    const {
      params: { filename, name, version },
    } = ctx;

    const blockAsset = await getBlockAsset({ filename, name, version });

    ctx.body = blockAsset.content;
    ctx.type = blockAsset.mime;
  };
}
