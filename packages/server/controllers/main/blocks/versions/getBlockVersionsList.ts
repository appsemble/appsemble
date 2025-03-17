import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { BlockVersion } from '../../../../models/index.js';

export async function getBlockVersionsList(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, organizationId },
  } = ctx;

  const blockVersions = await BlockVersion.findAll({
    attributes: ['version'],
    where: { name: blockId, OrganizationId: organizationId },
    order: [['created', 'DESC']],
  });

  assertKoaCondition(blockVersions.length !== 0, ctx, 404, 'Block not found');

  ctx.body = blockVersions.map((block) => String(block.version));
}
