import { type Context, type Middleware } from 'koa';
import { extension } from 'mime-types';

import { assertKoaCondition } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createGetAppAssetByIdController({ getApp, getAppAsset }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, assetId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaCondition(app != null, ctx, 404, 'App not found');

    const asset = await getAppAsset({ app, context: ctx, id: assetId });

    if (assetId !== asset.id) {
      // Redirect to asset using current asset ID
      ctx.status = 302;
      ctx.set('location', `/api/apps/${app.id}/assets/${asset.id}`);
      ctx.type = null;
      return;
    }

    let { filename, mime } = asset;
    if (!filename) {
      filename = asset.id;
      if (mime) {
        const ext = extension(mime);
        if (ext) {
          filename += `.${ext}`;
        }
      }
    }

    ctx.set('content-type', mime || 'application/octet-stream');

    if (filename) {
      ctx.set('content-disposition', `attachment; filename=${JSON.stringify(filename)}`);
    }

    ctx.set('Cache-Control', 'max-age=31536000,immutable');
    ctx.body = asset.stream;
  };
}
