import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { TrainingBlock } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingBlockId },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: 'appsemble',
    requiredPermissions: [OrganizationPermission.DeleteTrainingBlocks],
  });

  const trainingBlock = await TrainingBlock.findByPk(trainingBlockId);
  assertKoaError(!trainingBlock, ctx, 404, 'Training Block not found.');

  await trainingBlock.destroy();

  ctx.status = 204;
}
