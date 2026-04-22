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

function getFullDerivedAssetName(assetId: string): string {
  return `${assetId}-full-avif`;
}

function getDerivedFilename(assetId: string, filename?: string | null): string {
  if (!filename) {
    return `${assetId}.avif`;
  }

  const dotIndex = filename.lastIndexOf('.');
  return dotIndex === -1 ? `${filename}.avif` : `${filename.slice(0, dotIndex)}.avif`;
}

async function serveCachedDerivedAsset(
  ctx: Context,
  bucketName: string,
  sourceAsset: { id: string; filename?: string | null },
  cachedAsset: { id: string; destroy: () => Promise<unknown> },
): Promise<boolean> {
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
    return true;
  } catch (error) {
    if (!['NotFound', 'NoSuchKey'].includes((error as { code?: string })?.code ?? '')) {
      throw error;
    }

    await cachedAsset.destroy();
    return false;
  }
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
  const shouldResize =
    Number.isFinite(parsedWidth) &&
    Number.isFinite(parsedHeight) &&
    parsedWidth > 0 &&
    parsedHeight > 0;
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

  if (sourceAsset.mime?.startsWith('image')) {
    const fullDerivedAssetName = getFullDerivedAssetName(sourceAsset.id);

    if (shouldResize) {
      const cachedAsset = await Asset.findOne({
        where: {
          name: getDerivedAssetName(sourceAsset.id, parsedWidth, parsedHeight),
          ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
        },
        attributes: ['id', 'mime', 'filename', 'name'],
      });

      if (
        cachedAsset &&
        (await serveCachedDerivedAsset(ctx, bucketName, sourceAsset, cachedAsset))
      ) {
        return;
      }
    } else {
      const cachedAsset = await Asset.findOne({
        where: {
          name: fullDerivedAssetName,
          ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
        },
        attributes: ['id', 'mime', 'filename', 'name'],
      });

      if (
        cachedAsset &&
        (await serveCachedDerivedAsset(ctx, bucketName, sourceAsset, cachedAsset))
      ) {
        return;
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

    const shouldDownscale =
      shouldResize && (metadata.width > parsedWidth || metadata.height > parsedHeight);
    const derivedAssetName = shouldDownscale
      ? getDerivedAssetName(sourceAsset.id, parsedWidth, parsedHeight)
      : fullDerivedAssetName;

    if (!shouldDownscale && shouldResize) {
      const cachedAsset = await Asset.findOne({
        where: {
          name: fullDerivedAssetName,
          ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
        },
        attributes: ['id', 'mime', 'filename', 'name'],
      });

      if (
        cachedAsset &&
        (await serveCachedDerivedAsset(ctx, bucketName, sourceAsset, cachedAsset))
      ) {
        return;
      }
    }

    const derivedImage = shouldDownscale
      ? await image
          .rotate()
          .resize(parsedWidth, parsedHeight, {
            kernel: sharp.kernel.lanczos3,
            fit: 'cover',
            withoutEnlargement: true,
          })
          .avif()
          .toBuffer()
      : await image.rotate().avif().toBuffer();

    const newAsset = await Asset.create({
      name: derivedAssetName,
      mime: 'image/avif',
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    });

    await uploadS3File(bucketName, newAsset.id, derivedImage);

    setAssetHeaders(ctx, 'image/avif', getDerivedFilename(sourceAsset.id, sourceAsset.filename));
    ctx.body = derivedImage;
    return;
  }

  const stats = await getS3FileStats(bucketName, sourceAsset.id);
  const stream = await getS3File(bucketName, sourceAsset.id);

  setAssetHeaders(ctx, sourceAsset.mime ?? 'application/octet-stream', sourceFilename, stats);
  ctx.body = stream;
}
