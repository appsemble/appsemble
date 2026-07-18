import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

import { parseBlockName } from '@appsemble/lang-sdk';
import { deleteS3Files, logger, setS3BucketPolicy } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { argv } from './argv.js';
import { BlockAsset, BlockVersion } from '../models/index.js';

const blockAssetsBucketName = 'appsemble-block-assets';

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
  return [organizationId, blockName, version, contentHash, filename].join('/');
}

export function getBlockAssetPublicUrl(storageKey?: string | null): string | undefined {
  if (!storageKey || !argv.blockAssetsBaseUrl) {
    return;
  }

  const publicBase = `${argv.blockAssetsBaseUrl.replace(/\/+$/, '')}/`;
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
  if (!argv.blockAssetsBaseUrl) {
    return;
  }

  return new URL(argv.blockAssetsBaseUrl).origin;
}

export async function ensureBlockAssetsBucketPublicRead(): Promise<void> {
  if (!argv.blockAssetsBaseUrl) {
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

  if (!unreferencedStorageKeys.length) {
    return;
  }

  // Best-effort cleanup: block asset objects are immutable and content-addressed, so a failed or
  // orphaned delete is a storage leak, never data loss. On failure log the exact keys so they stay
  // recoverable instead of vanishing into a swallowed error.
  // ponytail: the reference check above and this delete are not atomic, so a concurrent publish of
  // the identical content committed in between could leave a referenced object deleted. Bounded by
  // content-addressing (re-uploadable) and rare; a mark-and-sweep GC is the upgrade path if needed.
  try {
    await deleteS3Files(getBlockAssetsBucketName(), unreferencedStorageKeys);
  } catch (error) {
    logger.error(
      `Failed to delete unreferenced block asset object(s): ${unreferencedStorageKeys.join(', ')}`,
    );
    logger.error(error);
  }
}
// Resolve public block asset URLs for a set of resolved block manifests, keyed by `name@version`.
// The URLs embed the deploy-time base URL, so they are derived from the immutable storage keys at
// request time instead of being persisted in the app build manifest.
export async function getSettingsBlockFileUrls(
  blockManifests: { name: string; version: string }[],
): Promise<Record<string, Record<string, string>>> {
  if (!argv.blockAssetsBaseUrl || !blockManifests.length) {
    return {};
  }

  const blockQueries = blockManifests.flatMap(({ name }) => {
    const parsed = parseBlockName(name);

    return parsed ? [{ name: parsed[1], OrganizationId: parsed[0] }] : [];
  });

  if (!blockQueries.length) {
    return {};
  }

  const versions = [...new Set(blockManifests.map(({ version }) => version))];
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
    where: { [Op.and]: [{ [Op.or]: blockQueries }, { version: { [Op.in]: versions } }] },
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
