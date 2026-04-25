import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

import { deleteS3Files } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { BlockAsset } from '../models/index.js';

const blockAssetsBucketName = 'appsemble-static-public';

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
