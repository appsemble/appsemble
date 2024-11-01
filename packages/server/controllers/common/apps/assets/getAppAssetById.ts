import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';

export async function getAppAssetById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const asset = await Asset.findOne({
    where: {
      AppId: appId,
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });

  assertKoaError(!asset, ctx, 404, 'Asset not found');

  if (assetId !== asset.id) {
    // Redirect to asset using current asset ID
    ctx.status = 302;
    ctx.set('location', `/api/apps/${appId}/assets/${asset.id}`);
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

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
  ctx.body = asset.data;
}
