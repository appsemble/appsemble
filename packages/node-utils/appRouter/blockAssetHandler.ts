import { notFound } from '@hapi/boom';
import { Context, Middleware } from 'koa';

import { AppRouterOptions } from '../types.js';

export function createBlockAssetHandler({ getBlockAsset }: AppRouterOptions): Middleware {
  return async (ctx: Context) => {
    const {
      params: { filename, name, version },
    } = ctx;

    const blockAsset = await getBlockAsset({ filename, name, version });

    if (!blockAsset) {
      throw notFound('Block asset not found');
    }

    ctx.body = blockAsset.content;
    ctx.type = blockAsset.mime;
  };
}
