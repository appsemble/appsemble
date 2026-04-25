import { assertKoaCondition, logger } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import {
  BlockAsset,
  BlockMessages,
  BlockVersion,
  transactional,
} from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { deleteUnreferencedBlockAssetObjects } from '../../../../utils/blockAssets.js';
import { findBlockInApps } from '../../../../utils/block.js';

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

  await transactional(async (transaction) => {
    const assets = await BlockAsset.findAll({
      attributes: ['storageKey'],
      transaction,
      where: { BlockVersionId: version.id },
    });
    const storageKeys = assets.flatMap((asset) => (asset.storageKey ? [asset.storageKey] : []));

    await BlockAsset.destroy({
      transaction,
      where: { BlockVersionId: version.id },
    });

    await BlockMessages.destroy({
      transaction,
      where: { BlockVersionId: version.id },
    });
    await version.destroy({ transaction });

    if (storageKeys.length) {
      transaction.afterCommit(async () => {
        try {
          await deleteUnreferencedBlockAssetObjects(storageKeys);
        } catch (error) {
          logger.error(error);
        }
      });
    }
  });

  ctx.status = 204;
}
