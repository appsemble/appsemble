import { type Options } from '@appsemble/node-utils';
import { notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

export function createBlockAssetHandler({ getBlockAsset }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      params: { filename, name, version },
    } = ctx;

    const blockAsset = await getBlockAsset({ filename, name, version, context: ctx });

    if (!blockAsset) {
      throw notFound('Block asset not found');
    }

    ctx.body = blockAsset.content;
    ctx.type = blockAsset.mime;
  };
}
