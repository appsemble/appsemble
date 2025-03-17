import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { BlockAsset, BlockMessages, BlockVersion, Organization } from '../../../models/index.js';
import { blockVersionToJson } from '../../../utils/block.js';

export async function getBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, organizationId },
  } = ctx;

  const blockVersion = await BlockVersion.findOne({
    attributes: [
      'created',
      'description',
      'examples',
      'longDescription',
      'name',
      'version',
      'actions',
      'events',
      'layout',
      'parameters',
      'wildcardActions',
      [literal('"BlockVersion".icon IS NOT NULL'), 'hasIcon'],
    ],
    where: { name: blockId, OrganizationId: organizationId },
    include: [
      { model: BlockAsset, attributes: ['filename'] },
      {
        model: Organization,
        attributes: ['id', 'updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      },
      {
        model: BlockMessages,
        attributes: ['language'],
        required: false,
      },
    ],
    order: [['created', 'DESC']],
  });

  assertKoaCondition(!!blockVersion, ctx, 404, 'Block definition not found');

  ctx.body = blockVersionToJson(blockVersion);
}
