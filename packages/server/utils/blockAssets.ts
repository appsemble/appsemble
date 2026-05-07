import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

import { deleteS3Files, setS3BucketPolicy } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { argv } from './argv.js';
import { BlockAsset } from '../models/index.js';

const blockAssetsBucketName = 'appsemble-static-public';

interface BlockAssetReference {
  filename: string;
  storageKey?: string | null;
}

interface BlockAssetLocation {
  blockName: string;
  contentHash: string;
  filename: string;
  organizationId: string;
  version: string;
}

export function getBlockAssetsBucketName(): string {
  return blockAssetsBucketName;
}

export function getBlockAssetStorageKey({
  blockName,
  contentHash,
  filename,
  organizationId,
  version,
}: BlockAssetLocation): string {
  return ['blocks', organizationId, blockName, version, contentHash, filename].join('/');
}

export function getBlockAssetPublicUrl(storageKey?: string | null): string | undefined {
  if (!storageKey || !argv.blockAssetsPublicUrl) {
    return;
  }

  const publicBase = `${argv.blockAssetsPublicUrl.replace(/\/+$/, '')}/`;
  const encodedPath = [getBlockAssetsBucketName(), ...storageKey.split('/')]
    .map(encodeURIComponent)
    .join('/');

  return String(new URL(encodedPath, publicBase));
}

export function getBlockAssetFileUrls(
  blockAssets: BlockAssetReference[] | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (blockAssets ?? []).flatMap(({ filename, storageKey }) => {
      const publicUrl = getBlockAssetPublicUrl(storageKey);

      return publicUrl ? [[filename, publicUrl]] : [];
    }),
  );
}

export function getBlockAssetPublicOrigin(): string | undefined {
  if (!argv.blockAssetsPublicUrl) {
    return;
  }

  return new URL(argv.blockAssetsPublicUrl).origin;
}

export async function ensureBlockAssetsBucketPublicRead(): Promise<void> {
  if (!argv.blockAssetsPublicUrl) {
    return;
  }

  await setS3BucketPolicy(
    getBlockAssetsBucketName(),
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${getBlockAssetsBucketName()}/*`],
        },
      ],
    }),
  );
}

export function getBlockAssetContentHash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

export async function getBlockAssetFileHash(path: string): Promise<string> {
  const hash = createHash('sha256');

  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

export async function deleteUnreferencedBlockAssetObjects(storageKeys: string[]): Promise<void> {
  const uniqueStorageKeys = [...new Set(storageKeys)];

  if (!uniqueStorageKeys.length) {
    return;
  }

  const referencedAssets = await BlockAsset.findAll({
    attributes: ['storageKey'],
    raw: true,
    where: {
      storageKey: {
        [Op.in]: uniqueStorageKeys,
      },
    },
  });
  const referencedStorageKeys = new Set(
    referencedAssets.flatMap(({ storageKey }) => (storageKey ? [storageKey] : [])),
  );
  const unreferencedStorageKeys = uniqueStorageKeys.filter(
    (key) => !referencedStorageKeys.has(key),
  );

  if (unreferencedStorageKeys.length) {
    await deleteS3Files(getBlockAssetsBucketName(), unreferencedStorageKeys);
  }
}
