import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';

export async function getAppAssetHeadersById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const assets = await Asset.findAll({
    attributes: ['id', 'mime', 'filename', 'name'],
    where: {
      AppId: appId,
      OriginalId: null,
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    include: [{ model: Asset, as: 'Compressed' }],
  });

  // Pick asset id over asset name.
  const asset = assets.find((a) => a.id === assetId) || assets.find((a) => a.name === assetId);

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
  if (!filename) {
    filename = baseAsset.id;
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

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
