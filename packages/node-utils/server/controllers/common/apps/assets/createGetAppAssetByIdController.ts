import { type Context, type Middleware } from 'koa';
import { extension } from 'mime-types';

import { assertKoaError } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createGetAppAssetByIdController({ getApp, getAppAssets }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, assetId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    const assets = await getAppAssets({ app, context: ctx });

    // Pick asset id over asset name
    const asset = assets.find((a) => a.id === assetId) || assets.find((a) => a.name === assetId);

    assertKoaError(!asset, ctx, 404, 'Asset not found');

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
    ctx.body = asset.data;
  };
}
