import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

import { type Context } from 'koa';

import { logger } from './logger.js';
import { getAppAssetLocation, type S3FileStats, uploadS3File } from './s3.js';
import { removeUploads } from './uploads.js';

// An asset URL addresses one fixed set of bytes when it carries the asset id, so it may be cached
// for a year. Addressed by name it is a pointer that can be aimed at a different asset, so it
// gets a bounded lifetime instead.
const IMMUTABLE_CACHE_CONTROL = 'max-age=31536000,immutable';
const MUTABLE_CACHE_CONTROL = 'max-age=3600';

export interface AssetValidators {
  etag?: string;
  lastModified?: Date;
  size?: number;
}

export interface AssetHeaderOptions extends AssetValidators {
  filename?: string | null;

  /**
   * Whether the request addressed the asset by its id rather than by its name.
   */
  immutable: boolean;

  mime: string;
}

/**
 * Map the stats of a stored S3 object onto the response validators derived from it.
 *
 * @param stats The stats of the stored object.
 * @returns The validators to pass to `setAssetHeaders`.
 */
export function assetValidators(stats: S3FileStats): AssetValidators {
  return { etag: stats.etag, lastModified: stats.lastModified, size: stats.size };
}

export function setAssetHeaders(
  ctx: Context,
  { etag, filename, immutable, lastModified, mime, size }: AssetHeaderOptions,
): void {
  ctx.set('content-type', mime || 'application/octet-stream');
  if (filename) {
    ctx.set(
      'content-disposition',
      `${mime?.startsWith('image') ? 'inline' : 'attachment'}; filename=${JSON.stringify(filename)}`,
    );
  }

  if (size != null) {
    ctx.set('Content-Length', String(size));
  }

  if (etag) {
    ctx.set('ETag', etag);
  }

  if (lastModified) {
    ctx.set('Last-Modified', lastModified.toUTCString());
  }

  // CORS exposes ETag and the Appsemble version on every API response. Keep those alongside the
  // header the asset endpoints add.
  const exposedHeaders = ctx.response.get('Access-Control-Expose-Headers');
  ctx.set(
    'Access-Control-Expose-Headers',
    exposedHeaders ? `${exposedHeaders}, Content-Disposition` : 'Content-Disposition',
  );
  ctx.set('Cache-Control', immutable ? IMMUTABLE_CACHE_CONTROL : MUTABLE_CACHE_CONTROL);
}

interface FileMeta {
  filename?: string;
  mime: string;
}

export function getCompressedFileMeta({ filename, mime }: FileMeta): FileMeta {
  return { filename, mime };
}

export interface AssetToUpload {
  id: string;
  mime: string;
  path: string;
}

export async function uploadAsset(appId: number, asset: AssetToUpload): Promise<void> {
  const { id, path } = asset;

  try {
    const stats = await stat(path);
    const stream = createReadStream(path);
    const { bucket, key } = getAppAssetLocation(appId, id);
    await uploadS3File(bucket, key, stream, stats.size);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function uploadAssets(appId: number, assets: AssetToUpload[]): Promise<void> {
  const filesToUnlink = [...new Set(assets.map(({ path }) => path))];

  try {
    for (const asset of assets) {
      await uploadAsset(appId, asset);
    }
  } finally {
    await removeUploads(filesToUnlink);
  }
}
