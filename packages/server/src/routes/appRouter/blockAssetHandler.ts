import { notFound } from '@hapi/boom';

import { BlockAsset } from '../../models';
import type { KoaContext } from '../../types';

interface Params {
  filename: string;
  name: string;
  version: string;
}

/**
 * Serve a block asset.
 *
 * @param ctx - The Koa context.
 */
export async function blockAssetHandler(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { filename, name, version },
  } = ctx;
  const [org, blockId] = name.split('/');

  const blockAsset = await BlockAsset.findOne({
    raw: true,
    attributes: ['mime', 'content'],
    where: { filename, name: blockId, OrganizationId: org.slice(1), version },
  });

  if (!blockAsset) {
    throw notFound('Block asset not found');
  }

  ctx.body = blockAsset.content;
  ctx.type = blockAsset.mime;
}
