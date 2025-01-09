import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { setHeaders } from './utils.js';
import { App, Asset } from '../../../../models/index.js';

export async function getAppAssetHeadersById(ctx: Context): Promise<void> {
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
    attributes: ['id', 'mime', 'filename', 'name'],
  });

  assertKoaError(!asset, ctx, 404, 'Asset not found');

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

  setHeaders(ctx, mime, filename);
}
