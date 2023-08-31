import { assertKoaError, type FindOptions, type Options } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context, type Middleware } from 'koa';
import { extension } from 'mime-types';

export function createGetAssets({ checkRole, getApp, getAppAssets }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      queryParams: { $skip, $top },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    const findOptions: FindOptions = {
      limit: $top,
      offset: $skip,
      where: { AppId: app.id },
    };

    await checkRole({ context: ctx, app, permissions: Permission.ReadAssets, findOptions });

    ctx.body = await getAppAssets({ app, context: ctx });
  };
}

export function createGetAssetById({ getApp, getAppAssets }: Options): Middleware {
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

export function createCreateAsset({ createAppAsset, getApp }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
      request: {
        body: {
          file: { contents, filename, mime },
          name,
        },
      },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    const asset = await createAppAsset({
      app,
      context: ctx,
      payload: { filename, mime, name, data: contents },
    });

    ctx.status = 201;
    ctx.body = { id: asset.id, mime, filename, name };
  };
}
