import {
  assertKoaCondition,
  getS3File,
  getS3FileBuffer,
  getS3FileStats,
  setAssetHeaders,
  uploadS3File,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';
import sharp from 'sharp';

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

function getDerivedAssetName(assetId: string, width: number, height: number): string {
  return `${assetId}${width}x${height}`;
}

function getDerivedFilename(assetId: string, filename?: string | null): string {
  if (!filename) {
    return `${assetId}.avif`;
  }

  const dotIndex = filename.lastIndexOf('.');
  return dotIndex === -1 ? `${filename}.avif` : `${filename.slice(0, dotIndex)}.avif`;
}

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
  const parsedWidth = Math.round(Number(width));
  const parsedHeight = Math.round(Number(height));
  const shouldResize = Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight);
  const sourceAsset = await Asset.findOne({
    where: {
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    attributes: ['id', 'mime', 'filename', 'name'],
  });
  assertKoaCondition(sourceAsset != null, ctx, 404, 'Asset not found');

  const bucketName = `app-${appId}`;
  const sourceFilename = getAssetFilename(sourceAsset.id, sourceAsset.filename, sourceAsset.mime);

  if (shouldResize && sourceAsset.mime?.startsWith('image')) {
    let cachedAsset = await Asset.findOne({
      where: {
        name: getDerivedAssetName(sourceAsset.id, parsedWidth, parsedHeight),
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      },
      attributes: ['id', 'mime', 'filename', 'name'],
    });

    if (cachedAsset) {
      try {
        const stats = await getS3FileStats(bucketName, cachedAsset.id);
        const stream = await getS3File(bucketName, cachedAsset.id);
        setAssetHeaders(
          ctx,
          'image/avif',
          getDerivedFilename(sourceAsset.id, sourceAsset.filename),
          stats,
        );
        ctx.body = stream;
        return;
      } catch (error) {
        if (!['NotFound', 'NoSuchKey'].includes((error as { code?: string })?.code ?? '')) {
          throw error;
        }
        await cachedAsset.destroy();
        cachedAsset = null;
      }
    }

    const sourceBuffer = await getS3FileBuffer(bucketName, sourceAsset.id);
    const image = sharp(sourceBuffer);
    const metadata = await image.metadata();
    assertKoaCondition(
      metadata.width != null && metadata.height != null,
      ctx,
      422,
      'Invalid asset',
    );

    if (metadata.width > parsedWidth * 4 && metadata.height > parsedHeight * 4) {
      const resizedImage = await image
        .rotate()
        .resize({
          width: parsedWidth * 4,
          kernel: sharp.kernel.lanczos3,
        })
        .gamma()
        .resize(parsedWidth, parsedHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'cover',
        })
        .avif()
        .toBuffer();

      const newAsset = await Asset.create({
        name: getDerivedAssetName(sourceAsset.id, parsedWidth, parsedHeight),
        mime: 'image/avif',
        ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
      });

      await uploadS3File(bucketName, newAsset.id, resizedImage);

      setAssetHeaders(ctx, 'image/avif', getDerivedFilename(sourceAsset.id, sourceAsset.filename));
      ctx.body = resizedImage;
      return;
    }
  }

  const stats = await getS3FileStats(bucketName, sourceAsset.id);
  const stream = await getS3File(bucketName, sourceAsset.id);

  setAssetHeaders(ctx, sourceAsset.mime ?? 'application/octet-stream', sourceFilename, stats);
  ctx.body = stream;
}
