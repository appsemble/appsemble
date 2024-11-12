import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { setHeaders } from './utils.js';
import { App, Asset } from '../../../../models/index.js';

export async function getAppAssetHeadersById(ctx: Context): Promise<void> {
  const {
    assetsCache,
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const cachedAsset = assetsCache.get(`${appId}-${assetId}`);

  if (cachedAsset) {
    setHeaders(ctx, cachedAsset.mime, cachedAsset.filename);
    return;
  }

  const originalAsset = await Asset.findOne({
    attributes: ['id', 'mime', 'filename', 'name'],
    where: {
      AppId: appId,
      OriginalId: null,
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    include: [{ model: Asset, as: 'Compressed', attributes: ['id', 'mime', 'filename', 'name'] }],
  });

  assertKoaError(!originalAsset, ctx, 404, 'Asset not found');

  const asset = originalAsset.Compressed || originalAsset;
  let { filename, mime } = asset;

  assetsCache.set(`${appId}-${originalAsset.id}`, asset.dataValues);

  if (originalAsset.name) {
    assetsCache.set(`${appId}-${originalAsset.name}`, asset.dataValues);
  }

  if (!filename) {
    filename = asset.id;
    if (mime) {
      const ext = extension(mime);
      if (ext) {
        filename += `.${ext}`;
      }
    }
  }

  setHeaders(ctx, mime, filename);
}
