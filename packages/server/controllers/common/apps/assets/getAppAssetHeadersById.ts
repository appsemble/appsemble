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

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  setAssetHeaders(ctx, mime, filename);
}
