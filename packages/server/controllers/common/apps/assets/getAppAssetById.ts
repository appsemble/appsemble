import {
  assertKoaCondition,
  getS3File,
  getS3FileStats,
  setAssetHeaders,
} from '@appsemble/node-utils';
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

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  const asset = await Asset.findOne({
    where: {
      AppId: appId,
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    attributes: ['id', 'mime', 'filename', 'name'],
  });

  assertKoaCondition(!!asset, ctx, 404, 'Asset not found');

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

  const stats = await getS3FileStats(`app-${appId}`, asset.id);
  const stream = await getS3File(`app-${appId}`, asset.id);

  setAssetHeaders(ctx, mime, filename, stats);

  ctx.body = stream;
}
