import { type Context, type Middleware } from 'koa';

import { assertKoaCondition } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createCreateAppAssetController({ createAppAsset, getApp }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      request: {
        body: {
          file: { filename, mime, path },
          name,
        },
      },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaCondition(!!app, ctx, 404, 'App not found');

    const asset = await createAppAsset({
      app,
      context: ctx,
      payload: { filename, mime, name, path },
    });

    ctx.status = 201;
    ctx.body = { id: asset.id, mime, filename, name };
  };
}
