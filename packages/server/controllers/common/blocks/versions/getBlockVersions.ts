import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { BlockAsset, BlockMessages, BlockVersion, Organization } from '../../../../models/index.js';
import { blockVersionToJson } from '../../../../utils/block.js';

export async function getBlockVersions(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, organizationId },
  } = ctx;

  const blockVersions = await BlockVersion.findAll({
    attributes: [
      'actions',
      'description',
      'longDescription',
      'name',
      'events',
      'examples',
      'layout',
      'version',
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
        required: false,
        attributes: ['language'],
      },
    ],
    order: [['created', 'DESC']],
  });

  assertKoaCondition(blockVersions.length !== 0, ctx, 404, 'Block not found.');

  ctx.body = blockVersions.map(blockVersionToJson);
}
