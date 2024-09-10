import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { TrainingBlock } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingBlockId },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permissions.DeleteApps);

  const trainingBlock = await TrainingBlock.findByPk(trainingBlockId);
  assertKoaError(!trainingBlock, ctx, 404, 'Training Block not found.');

  await trainingBlock.destroy();

  ctx.status = 204;
}
