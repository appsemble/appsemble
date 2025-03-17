import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { BlockAsset, BlockVersion } from '../../../../../models/index.js';

export async function getBlockVersionAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
    query: { filename },
  } = ctx;

  const block = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
    include: [
      { model: BlockAsset, where: { filename }, attributes: ['content', 'mime'], required: false },
    ],
  });

  assertKoaCondition(!!block, ctx, 404, 'Block version not found');
  assertKoaCondition(
    block.BlockAssets.length === 1,
    ctx,
    404,
    `Block has no asset named "${filename}"`,
  );

  ctx.body = block.BlockAssets[0].content;
  ctx.type = block.BlockAssets[0].mime;
}
