import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { BlockMessages, BlockVersion } from '../../../../../models/index.js';

export async function getBlockVersionMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, language, organizationId },
  } = ctx;

  const block = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
    include: [
      {
        model: BlockMessages,
        required: false,
        where: { language },
      },
    ],
  });

  assertKoaCondition(!!block, ctx, 404, 'Block version not found');
  assertKoaCondition(
    block.BlockMessages.length === 1,
    ctx,
    404,
    'Block has no messages for language "en"',
  );

  ctx.body = block.BlockMessages[0].messages;
}
