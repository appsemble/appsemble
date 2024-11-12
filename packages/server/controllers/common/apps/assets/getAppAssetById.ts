import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { setHeaders } from './utils.js';
import { App, Asset } from '../../../../models/index.js';

export async function getAppAssetById(ctx: Context): Promise<void> {
  const {
    assetsCache,
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const cachedAsset = assetsCache.get(`${appId}-${assetId}`);

  if (cachedAsset && cachedAsset.data) {
    setHeaders(ctx, cachedAsset.mime, cachedAsset.filename);
    ctx.body = Buffer.from(cachedAsset.data);
    return;
  }

  const where: { AppId: number; OriginalId: string; [Op.or]: any[] } = {
    AppId: appId,
    OriginalId: null,
    [Op.or]: [{ id: assetId }, { name: assetId }],
    ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
  };

  const assetWithCompressed = await Asset.findOne({
    where,
    attributes: ['id', 'mime', 'filename', 'name'],
    include: [
      {
        model: Asset,
        as: 'Compressed',
        required: true,
        attributes: ['id', 'mime', 'filename', 'name', 'data'],
      },
    ],
  });

  const originalAsset =
    assetWithCompressed ||
    (await Asset.findOne({ where, attributes: ['id', 'mime', 'filename', 'name', 'data'] }));

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
  ctx.body = asset.data;
}
