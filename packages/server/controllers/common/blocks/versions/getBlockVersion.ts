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
    attributes: ['id', 'manifestJson'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  assertKoaCondition(version != null, ctx, 404, 'Block version not found');

  if (version.manifestJson) {
    ctx.body = version.manifestJson;
    ctx.set('Cache-Control', 'public,max-age=31536000,immutable');
    return;
  }

  const blockVersionRecord = await BlockVersion.findByPk(version.id, {
    attributes: [
      'actions',
      'events',
      'layout',
      'name',
      'parameters',
      'description',
      'examples',
      'longDescription',
      'repositoryUrl',
      'version',
      'wildcardActions',
      [literal('"BlockVersion".icon IS NOT NULL'), 'hasIcon'],
    ],
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

  assertKoaCondition(blockVersionRecord != null, ctx, 404, 'Block version not found');

  const manifestJson = blockVersionToJson(blockVersionRecord);
  await BlockVersion.update(
    { manifestJson },
    {
      where: {
        id: version.id,
        manifestJson: null,
      },
    },
  );

  ctx.body = manifestJson;
  ctx.set('Cache-Control', 'public,max-age=31536000,immutable');
}
