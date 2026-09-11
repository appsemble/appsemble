import { assertKoaCondition, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createBlockAssetHandler({ getBlockAsset }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      // @ts-expect-error Messed up
      params: { filename, name, version },
    } = ctx;

    const blockAsset = await getBlockAsset({ filename, name, version, context: ctx });

    assertKoaCondition(blockAsset != null, ctx, 404, 'Block asset not found');

    ctx.set('Cache-Control', 'public,max-age=31536000,immutable');

    if (blockAsset.size != null) {
      ctx.set('Content-Length', String(blockAsset.size));
    }

    if (blockAsset.etag) {
      ctx.set('ETag', blockAsset.etag);
    }

    if (blockAsset.lastModified) {
      ctx.set('Last-Modified', blockAsset.lastModified.toUTCString());
    }

    ctx.body = blockAsset.stream ?? blockAsset.content;
    ctx.type = blockAsset.mime;
  };
}
