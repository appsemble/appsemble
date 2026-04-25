import { assertKoaCondition, getS3File, getS3FileStats, logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { BlockAsset, BlockVersion } from '../../../../../models/index.js';
import { getBlockAssetsBucketName } from '../../../../../utils/blockAssets.js';

export async function getBlockVersionAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
    query: { filename },
  } = ctx;

  const block = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  assertKoaCondition(block != null, ctx, 404, 'Block version not found');

  const asset = await BlockAsset.findOne({
    attributes: ['id', 'mime', 'storageKey'],
    where: { filename, BlockVersionId: block.id },
  });

  assertKoaCondition(asset != null, ctx, 404, `Block has no asset named "${filename}"`);

  ctx.set('Cache-Control', 'public,max-age=31536000,immutable');

  if (asset.storageKey) {
    try {
      const stream = await getS3File(getBlockAssetsBucketName(), asset.storageKey);

      if (stream) {
        const stats = await getS3FileStats(getBlockAssetsBucketName(), asset.storageKey);

        ctx.set('Content-Length', String(stats.size));
        ctx.set('ETag', stats.etag);
        ctx.set('Last-Modified', stats.lastModified.toUTCString());
        ctx.body = stream;
        ctx.type = asset.mime ?? 'application/octet-stream';
        return;
      }
    } catch (error) {
      logger.warn(error);
    }
  }

  const fallbackAsset = await BlockAsset.findByPk(asset.id, {
    attributes: ['content'],
  });

  assertKoaCondition(
    fallbackAsset?.content != null,
    ctx,
    404,
    `Block has no asset named "${filename}"`,
  );

  ctx.body = fallbackAsset.content;
  ctx.type = asset.mime ?? 'application/octet-stream';
}
