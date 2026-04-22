import { assertKoaCondition, setAssetHeaders } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';

function getDerivedFilename(assetId: string, filename?: string | null): string {
  if (!filename) {
    return `${assetId}.avif`;
  }

  const dotIndex = filename.lastIndexOf('.');
  return dotIndex === -1 ? `${filename}.avif` : `${filename.slice(0, dotIndex)}.avif`;
}

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

  if (mime?.startsWith('image')) {
    mime = 'image/avif';
    filename = getDerivedFilename(asset.id, filename);
  } else if (!filename) {
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
