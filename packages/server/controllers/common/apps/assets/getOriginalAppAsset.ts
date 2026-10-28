import {
  assertKoaCondition,
  assetValidators,
  getAppAssetLocation,
  getS3File,
  getS3FileStats,
  setAssetHeaders,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';

function getAssetFilename(assetId: string, filename?: string | null, mime?: string | null): string {
  if (filename) {
    return filename;
  }

  if (mime) {
    const ext = extension(mime);
    if (ext) {
      return `${assetId}.${ext}`;
    }
  }

  return assetId;
}

export async function getOriginalAppAsset(ctx: Context): Promise<void> {
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

  const { bucket, key } = getAppAssetLocation(appId, asset.id);
  const filename = getAssetFilename(asset.id, asset.filename, asset.mime);
  const stats = await getS3FileStats(bucket, key);
  const stream = await getS3File(bucket, key);

  setAssetHeaders(ctx, {
    mime: asset.mime ?? 'application/octet-stream',
    filename,
    // Both the asset id and the asset name resolve here. Only the id keeps addressing these bytes
    // after the name is pointed at a different asset.
    immutable: assetId === asset.id,
    ...assetValidators(stats),
  });

  if (asset.mime?.toLowerCase().split(';', 1)[0].trim() === 'image/svg+xml') {
    // An inline SVG renders as a document on this origin; sandbox it and block all resource loading
    // to neutralize scripts and external references in user-uploaded SVGs.
    ctx.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }

  ctx.body = stream;
}
