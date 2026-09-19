import { parseBlockName } from '@appsemble/lang-sdk';
import {
  blockAssetsBucketName,
  deleteS3Files,
  getBlockAssetLocation,
  getS3Bucket,
  logger,
  setS3BucketPolicy,
} from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { argv } from './argv.js';
import { BlockAsset, BlockVersion } from '../models/index.js';

interface BlockAssetReference {
  filename: string;
  storageKey?: string | null;
}

interface BlockAssetLocation {
  blockName: string;
  blockVersionId: string;
  filename: string;
  organizationId: string;
  version: string;
}

export function getBlockAssetStorageKey({
  blockName,
  blockVersionId,
  filename,
  organizationId,
  version,
}: BlockAssetLocation): string {
  return [organizationId, blockName, version, blockVersionId, filename].join('/');
}

export function getBlockAssetPublicUrl(storageKey?: string | null): string | undefined {
  if (!storageKey || !argv.blockAssetsBaseUrl) {
    return;
  }

  const publicBase = `${argv.blockAssetsBaseUrl.replace(/\/+$/, '')}/`;
  const { bucket, key } = getBlockAssetLocation(storageKey);
  const encodedPath = [bucket, ...key.split('/')].map(encodeURIComponent).join('/');

  return String(new URL(encodedPath, publicBase));
}

export function getBlockAssetFileUrls(
  blockAssets: BlockAssetReference[] | undefined,
): Record<string, string> {
  if (!blockAssets?.length || blockAssets.some(({ storageKey }) => !storageKey)) {
    return {};
  }

  return Object.fromEntries(
    blockAssets.flatMap(({ filename, storageKey }) => {
      const publicUrl = getBlockAssetPublicUrl(storageKey);

      return publicUrl ? [[filename, publicUrl]] : [];
    }),
  );
}

export function getBlockAssetPublicOrigin(): string | undefined {
  if (!argv.blockAssetsBaseUrl) {
    return;
  }

  return new URL(argv.blockAssetsBaseUrl).origin;
}

/**
 * Grant anonymous read access to the block assets bucket in the bucket-per-app layout.
 *
 * In the single-bucket layout the operator grants public read on the `blocks/` prefix; the server
 * manages no bucket policy there.
 */
export async function ensureBlockAssetsBucketPublicRead(): Promise<void> {
  if (!argv.blockAssetsBaseUrl || getS3Bucket()) {
    return;
  }

  await setS3BucketPolicy(
    blockAssetsBucketName,
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${blockAssetsBucketName}/*`],
        },
      ],
    }),
  );
}

export async function deleteBlockAssetObjects(storageKeys: string[]): Promise<void> {
  const uniqueStorageKeys = [...new Set(storageKeys)];

  if (!uniqueStorageKeys.length) {
    return;
  }

  const locations = uniqueStorageKeys.map(getBlockAssetLocation);
  try {
    await deleteS3Files(
      locations[0].bucket,
      locations.map(({ key }) => key),
    );
  } catch (error) {
    logger.error(`Failed to delete block asset object(s): ${uniqueStorageKeys.join(', ')}`);
    logger.error(error);
  }
}

// Resolve public block asset URLs for a set of resolved block manifests, keyed by `name@version`.
// The URLs embed deployment configuration and are derived from immutable storage keys per request.
export async function getSettingsBlockFileUrls(
  blockManifests: { name: string; version: string }[],
): Promise<Record<string, Record<string, string>>> {
  if (!argv.blockAssetsBaseUrl || !blockManifests.length) {
    return {};
  }

  const blockQueries = blockManifests.flatMap(({ name, version }) => {
    const parsed = parseBlockName(name);

    return parsed ? [{ name: parsed[1], OrganizationId: parsed[0], version }] : [];
  });

  if (!blockQueries.length) {
    return {};
  }

  const blockVersions = await BlockVersion.findAll({
    attributes: ['name', 'OrganizationId', 'version'],
    include: [
      {
        attributes: ['filename', 'storageKey'],
        model: BlockAsset,
        required: false,
        where: { BlockVersionId: { [Op.col]: 'BlockVersion.id' } },
      },
    ],
    where: { [Op.or]: blockQueries },
  });

  return Object.fromEntries(
    blockVersions.flatMap((blockVersion) => {
      const fileUrls = getBlockAssetFileUrls(blockVersion.BlockAssets);

      return Object.keys(fileUrls).length
        ? [
            [
              `@${blockVersion.OrganizationId}/${blockVersion.name}@${blockVersion.version}`,
              fileUrls,
            ],
          ]
        : [];
    }),
  );
}
