import {
  assertKoaCondition,
  getS3File,
  getS3FileStats,
  setAssetHeaders,
  uploadS3File,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';
import sharp from 'sharp';

import { App, getAppDB } from '../../../../models/index.js';

export async function getAppAssetById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
    queryParams: { height, width },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { Asset } = await getAppDB(appId);
  let asset;
  let resizedImage;
  let stats;
  let stream;
  let filename;
  let mime;

  if (width && height) {
    asset = await Asset.findOne({
      where: {
        [Op.or]: [{ name: `${assetId}${Math.round(width)}x${Math.round(height)}` }],
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
      attributes: ['id', 'mime', 'filename', 'name'],
    });
    if (asset) {
      stats = await getS3FileStats(`app-${appId}`, asset.id);
      stream = await getS3File(`app-${appId}`, asset.id);
      ({ filename, mime } = asset);
      if (!filename) {
        filename = asset.id;
        if (mime) {
          const ext = extension(mime);
          if (ext) {
            filename += `.${ext}`;
          }
        }
      }
    }
  }

  if (!asset) {
    asset = await Asset.findOne({
      where: {
        [Op.or]: [{ id: assetId }, { name: assetId }],
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
      attributes: ['id', 'mime', 'filename', 'name'],
    });
    assertKoaCondition(asset != null, ctx, 404, 'Asset not found');

    stats = await getS3FileStats(`app-${appId}`, asset.id);
    stream = await getS3File(`app-${appId}`, asset.id);
    ({ filename, mime } = asset);
    if (!filename) {
      filename = asset.id;
      if (mime) {
        const ext = extension(mime);
        if (ext) {
          filename += `.${ext}`;
        }
      }
    }

    if (width && height && mime?.startsWith('image')) {
      const mid = sharp();
      stream.pipe(mid);
      const metadata = await mid.metadata();
      assertKoaCondition(
        metadata.width != null && metadata.height != null,
        ctx,
        422,
        'Invalid asset',
      );
      if (metadata.width > width * 4 && metadata.height > height * 4) {
        resizedImage = await mid
          .resize({
            width: Math.round(width) * 4,
            kernel: sharp.kernel.lanczos3,
          })
          .gamma()
          .toBuffer();
        stream = await sharp(resizedImage)
          .resize(Math.round(width), Math.round(height), {
            kernel: sharp.kernel.lanczos3,
            fit: 'cover',
          })
          .avif()
          .toBuffer();

        const newAsset = await Asset.create({
          name: `${assetId}${Math.round(width)}x${Math.round(height)}`,
          mime: 'image/avif',
        });

        await uploadS3File(`app-${appId}`, newAsset.id, resizedImage);
      } else {
        stream = await mid.avif().toBuffer();
      }
    }
  }

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  setAssetHeaders(ctx, mime, filename, stats);

  ctx.body = stream;
}
