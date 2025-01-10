import { createReadStream, existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';

import { type TempFile, uploadS3File } from '@appsemble/node-utils';
import sharp from 'sharp';

export function getCompressedFileMeta({
  filename,
  mime,
}: Omit<TempFile, 'path'>): Omit<TempFile, 'path'> {
  if (mime?.startsWith('image') && mime !== 'image/avif') {
    return {
      filename: filename.includes('.')
        ? `${filename.slice(0, filename.lastIndexOf('.'))}.avif`
        : `${filename}.avif`,
      mime: 'image/avif',
    };
  }

  return { filename, mime };
}

export async function uploadAssetFile(
  appId: number,
  assetId: string,
  file: Omit<TempFile, 'filename'>,
): Promise<void> {
  const { mime, path } = file;

  let uploadFrom = path;
  if (mime?.startsWith('image') && mime !== 'image/avif') {
    uploadFrom = `${path}_compressed`;
    await sharp(path).rotate().toFormat('avif').toFile(uploadFrom);
  }

  const stream = createReadStream(uploadFrom);
  await uploadS3File(`app-${appId}`, assetId, stream);
  await unlink(path);

  if (existsSync(uploadFrom)) {
    await unlink(uploadFrom);
  }
}
