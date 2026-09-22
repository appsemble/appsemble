import {
  getBlockAssetLocation,
  getS3File,
  getS3FileStats,
  logger,
  type ProjectAsset as BlockAssetInterface,
  type GetBlockAssetParams,
} from '@appsemble/node-utils';

import { BlockAsset, BlockVersion } from '../models/index.js';

export async function getBlockAsset({
  filename,
  name,
  version,
}: GetBlockAssetParams): Promise<BlockAssetInterface> {
  const [org, blockId] = name.split('/');
  const organizationId = org.slice(1);

  const blockVersion = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, version, OrganizationId: organizationId },
  });

  if (!blockVersion) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  const asset = await BlockAsset.findOne({
    attributes: ['content', 'filename', 'mime', 'storageKey'],
    where: { filename, BlockVersionId: blockVersion.id },
  });

  if (!asset) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  if (asset.storageKey) {
    try {
      const { bucket, key } = getBlockAssetLocation(asset.storageKey);
      const stats = await getS3FileStats(bucket, key);
      const stream = await getS3File(bucket, key);

      if (stream) {
        return {
          etag: stats.etag,
          filename: asset.filename,
          lastModified: stats.lastModified,
          mime: asset.mime ?? 'application/octet-stream',
          size: stats.size,
          stream,
        };
      }
    } catch (error) {
      logger.warn(error);
    }
  }

  // Fall back to database-backed content for assets that have not been migrated to S3 yet.
  if (asset.content) {
    return {
      content: asset.content,
      filename: asset.filename,
      mime: asset.mime ?? 'application/octet-stream',
    };
  }

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return null;
}
