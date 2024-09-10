import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { BlockAsset, BlockMessages, BlockVersion } from '../../../../models/index.js';
import { findBlockInApps } from '../../../../utils/block.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteBlockVersion(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  assertKoaError(!version, ctx, 404, 'Block version not found');

  await checkRole(ctx, organizationId, Permissions.DeleteBlocks);
  const usedBlocks = await findBlockInApps(blockId, blockVersion, organizationId);

  assertKoaError(usedBlocks, ctx, 403, 'Cannot delete blocks that are used by apps.');

  await BlockAsset.destroy({
    where: { BlockVersionId: version.id },
  });

  await BlockMessages.destroy({
    where: { BlockVersionId: version.id },
  });
  await version.destroy();
  ctx.status = 204;
}
