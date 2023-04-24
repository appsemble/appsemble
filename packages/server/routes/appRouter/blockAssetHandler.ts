import { notFound } from '@hapi/boom';
import { type Context } from 'koa';

import { BlockAsset, BlockVersion } from '../../models/index.js';

/**
 * Serve a block asset.
 *
 * @param ctx The Koa context.
 */
export async function blockAssetHandler(ctx: Context): Promise<void> {
  const {
    params: { filename, name, version },
  } = ctx;
  const [org, blockId] = name.split('/');

  const blockVersion = await BlockVersion.findOne({
    where: { name: blockId, version, OrganizationId: org.slice(1) },
    include: [{ model: BlockAsset, attributes: ['mime', 'content'], where: { filename } }],
  });

  if (!blockVersion) {
    throw notFound('Block asset not found');
  }

  ctx.body = blockVersion.BlockAssets[0].content;
  ctx.type = blockVersion.BlockAssets[0].mime;
}
