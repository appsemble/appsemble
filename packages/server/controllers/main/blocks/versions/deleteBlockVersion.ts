import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import {
  BlockAsset,
  BlockMessages,
  BlockVersion,
  transactional,
} from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { findBlockInApps } from '../../../../utils/block.js';
import { deleteBlockAssetObjects } from '../../../../utils/blockAssets.js';

export async function deleteBlockVersion(ctx: Context): Promise<void> {
  const {
    pathParams: { blockId, blockVersion, organizationId },
  } = ctx;

  const version = await BlockVersion.findOne({
    attributes: ['id'],
    where: { name: blockId, OrganizationId: organizationId, version: blockVersion },
  });

  assertKoaCondition(version != null, ctx, 404, 'Block version not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.DeleteBlocks],
  });
  const usedBlocks = await findBlockInApps(blockId, blockVersion, organizationId);

  assertKoaCondition(!usedBlocks, ctx, 403, 'Cannot delete blocks that are used by apps.');

  const blockAssets = await BlockAsset.findAll({
    attributes: ['storageKey'],
    where: { BlockVersionId: version.id },
  });

  await transactional(async (transaction) => {
    await BlockAsset.destroy({
      transaction,
      where: { BlockVersionId: version.id },
    });

    await BlockMessages.destroy({
      transaction,
      where: { BlockVersionId: version.id },
    });
    await version.destroy({ transaction });
  });

  await deleteBlockAssetObjects(
    blockAssets.flatMap(({ storageKey }) => (storageKey ? [storageKey] : [])),
  );

  ctx.status = 204;
}
