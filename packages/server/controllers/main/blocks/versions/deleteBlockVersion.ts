import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { BlockAsset, BlockMessages, BlockVersion } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';
import { findBlockInApps } from '../../../../utils/block.js';

export async function deleteBlockVersion(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  assertKoaError(!version, ctx, 404, 'Block version not found');

  await checkUserPermissions(ctx, organizationId, [MainPermission.DeleteBlocks]);
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
