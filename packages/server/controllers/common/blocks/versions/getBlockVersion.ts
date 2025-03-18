import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { BlockAsset, BlockMessages, BlockVersion, Organization } from '../../../../models/index.js';
import { blockVersionToJson } from '../../../../utils/block.js';

export async function getBlockVersion(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: [
      'actions',
      'events',
      'layout',
      'name',
      'parameters',
      'description',
      'examples',
      'longDescription',
      'version',
      'wildcardActions',
      [literal('"BlockVersion".icon IS NOT NULL'), 'hasIcon'],
    ],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
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
  });

  assertKoaCondition(version != null, ctx, 404, 'Block version not found');

  ctx.body = blockVersionToJson(version);
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
