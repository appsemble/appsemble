import { createReadStream } from 'node:fs';

import { type Context } from 'koa';
import { type BucketItemStat } from 'minio';
import sharp from 'sharp';

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

const ignoredMimes = new Set<string>(['image/avif']);

interface FileMeta {
  filename?: string;
  mime: string;
}

export function getCompressedFileMeta({ filename, mime }: FileMeta): FileMeta {
  if (mime?.startsWith('image') && !ignoredMimes.has(mime)) {
    return {
      filename: filename
        ? filename.includes('.')
          ? `${filename.slice(0, filename.lastIndexOf('.'))}.avif`
          : `${filename}.avif`
        : undefined,
      mime: 'image/avif',
    };
  }

  return { filename, mime };
}

export interface AssetToUpload {
  id: string;
  mime: string;
  path: string;
}

export async function uploadAsset(appId: number, asset: AssetToUpload): Promise<string[]> {
  const { id, mime, path } = asset;
  const filesToUnlink: string[] = [path];

  let uploadFrom = path;
  if (mime?.startsWith('image') && !ignoredMimes.has(mime)) {
    uploadFrom = `${path}_compressed`;
    await sharp(path).rotate().toFormat('avif').toFile(uploadFrom);
    filesToUnlink.push(uploadFrom);
  }

  try {
    const stream = createReadStream(uploadFrom);
    await uploadS3File(`app-${appId}`, id, stream);
  } catch (error) {
    logger.error(error);
  }

  return filesToUnlink;
}

export async function uploadAssets(appId: number, assets: AssetToUpload[]): Promise<void> {
  const filesToUnlink: string[] = [];

  for (const asset of assets) {
    const toUnlink = await uploadAsset(appId, asset);

    for (const path of toUnlink) {
      if (!filesToUnlink.includes(path)) {
        filesToUnlink.push(path);
      }
    }
  }

  await removeUploads(filesToUnlink);
}
