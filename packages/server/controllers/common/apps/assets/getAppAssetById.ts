import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';
import { assetsCache } from '../../../../utils/assetCache.js';

function setHeaders(ctx: Context, mime: string, filename: string | null): void {
  ctx.set('content-type', mime || 'application/octet-stream');
  if (filename) {
    ctx.set('content-disposition', `attachment; filename=${JSON.stringify(filename)}`);
  }

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}

export async function getAppAssetById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  const cacheKey = `${appId}-${assetId}`;
  const cachedAsset = assetsCache.get(cacheKey);
  if (cachedAsset) {
    setHeaders(ctx, cachedAsset.mime, cachedAsset.filename);
    ctx.body = Buffer.from(cachedAsset.data);
    return;
  }

  const where = {
    AppId: appId,
    [Op.or]: [{ id: assetId }, { name: assetId }],
    ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
  };

  const assetWithCompressed = await Asset.findOne({
    where: { ...where, OriginalId: null },
    attributes: { exclude: ['data'] },
    include: [{ model: Asset, as: 'Compressed', required: true }],
  });

  const asset = assetWithCompressed || (await Asset.findOne({ where }));

  assertKoaError(!asset, ctx, 404, 'Asset not found');

  if (assetId !== asset.id) {
    // Redirect to asset using current asset ID
    ctx.status = 302;
    ctx.set('location', `/api/apps/${appId}/assets/${asset.id}`);
    ctx.type = null;
    return;
  }

  const baseAsset = asset.Compressed || asset;
  let { filename, mime } = baseAsset;
  assetsCache.set(cacheKey, baseAsset.dataValues);
  if (!filename) {
    filename = baseAsset.id;
    if (mime) {
      const ext = extension(mime);
      if (ext) {
        filename += `.${ext}`;
      }
    }
  }
  setHeaders(ctx, mime, filename);
  ctx.body = baseAsset.data;
}
