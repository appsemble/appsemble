import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { TrainingBlock } from '../../../models/index.js';
import { checkUserPermissions } from '../../../utils/authorization.js';

export async function deleteTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingBlockId },
  } = ctx;

  await checkUserPermissions(ctx, 'appsemble', [MainPermission.DeleteTrainingBlocks]);

  const trainingBlock = await TrainingBlock.findByPk(trainingBlockId);
  assertKoaError(!trainingBlock, ctx, 404, 'Training Block not found.');

  await trainingBlock.destroy();

  ctx.status = 204;
}
