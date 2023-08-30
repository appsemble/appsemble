import { type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createBlockAssetHandler({ getBlockAsset }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      params: { filename, name, version },
    } = ctx;

    const blockAsset = await getBlockAsset({ filename, name, version, context: ctx });

    if (!blockAsset) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        message: 'Block asset not found',
        error: 'Not Found',
      };
      ctx.throw();
    }

    ctx.body = blockAsset.content;
    ctx.type = blockAsset.mime;
  };
}
