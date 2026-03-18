import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

import { type Context } from 'koa';
import { type BucketItemStat } from 'minio';

import { logger } from './logger.js';
import { uploadS3File } from './s3.js';
import { removeUploads } from './uploads.js';

export function setAssetHeaders(
  ctx: Context,
  mime: string,
  filename: string | null,
  stats?: BucketItemStat,
): void {
  ctx.set('content-type', mime || 'application/octet-stream');
  if (filename) {
    ctx.set(
      'content-disposition',
      `${mime?.startsWith('image') ? 'inline' : 'attachment'}; filename=${JSON.stringify(filename)}`,
    );
  }

  if (stats) {
    ctx.set('Content-Length', String(stats.size));
    ctx.set('ETag', stats.etag);
    ctx.set('Last-Modified', stats.lastModified.toUTCString());
  }

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
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

export async function uploadAsset(appId: number, asset: AssetToUpload): Promise<string[]> {
  const { id, path } = asset;
  const filesToUnlink = [path];

  try {
    const stats = await stat(path);
    const stream = createReadStream(path);
    await uploadS3File(`app-${appId}`, id, stream, stats.size);
  } catch (error) {
    logger.error(error);
    throw error;
  }

  return filesToUnlink;
}

export async function uploadAssets(appId: number, assets: AssetToUpload[]): Promise<void> {
  const filesToUnlink: string[] = [];

  try {
    for (const asset of assets) {
      const toUnlink = await uploadAsset(appId, asset);

      for (const path of toUnlink) {
        if (!filesToUnlink.includes(path)) {
          filesToUnlink.push(path);
        }
      }
    }
  } finally {
    await removeUploads(filesToUnlink);
  }
}
