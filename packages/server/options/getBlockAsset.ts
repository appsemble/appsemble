import {
  getS3File,
  getS3FileStats,
  logger,
  type ProjectAsset as BlockAssetInterface,
  type GetBlockAssetParams,
} from '@appsemble/node-utils';

import { BlockAsset, BlockVersion } from '../models/index.js';
import { getBlockAssetsBucketName } from '../utils/blockAssets.js';

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
    attributes: ['filename', 'id', 'mime', 'size', 'storageKey'],
    where: { filename, BlockVersionId: blockVersion.id },
  });

  if (!asset) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  if (asset.storageKey) {
    try {
      const stream = await getS3File(getBlockAssetsBucketName(), asset.storageKey);

      if (stream) {
        const stats = await getS3FileStats(getBlockAssetsBucketName(), asset.storageKey);

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

  const fallbackAsset = await BlockAsset.findByPk(asset.id, {
    attributes: ['content'],
  });

  if (!fallbackAsset?.content) {
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  return {
    content: fallbackAsset.content,
    filename: asset.filename,
    mime: asset.mime ?? 'application/octet-stream',
    size: asset.size ?? fallbackAsset.content.byteLength,
  };
}
