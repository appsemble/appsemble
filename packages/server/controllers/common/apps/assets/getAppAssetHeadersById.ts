import { assertKoaCondition, setAssetHeaders } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';

export async function getAppAssetHeadersById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { Asset } = await getAppDB(appId);
  const asset = await Asset.findOne({
    where: {
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    attributes: ['id', 'mime', 'filename', 'name'],
  });

  assertKoaCondition(asset != null, ctx, 404, 'Asset not found');

  // The derived GET codec depends on the source's alpha channel, which is unknown here without
  // fetching the source. No consumer reads the derived codec from HEAD (blocks only branch
  // image-vs-video), so advertise the source's own mime and filename.
  let { filename } = asset;
  const { mime } = asset;

  if (!filename) {
    filename = asset.id;
    if (mime) {
      const ext = extension(mime);
      if (ext) {
        filename += `.${ext}`;
      }
    }
  }

  setAssetHeaders(ctx, mime ?? 'application/octet-stream', filename ?? asset.id);
}
