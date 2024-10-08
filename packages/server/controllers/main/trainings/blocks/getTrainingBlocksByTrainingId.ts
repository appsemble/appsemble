import { type Context } from 'koa';

import { TrainingBlock } from '../../../../models/index.js';

export async function getTrainingBlocksByTrainingId(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
  } = ctx;

  const trainingBlocks = await TrainingBlock.findAll({
    where: {
      TrainingId: trainingId,
    },
  });
  ctx.status = 200;
  ctx.body = trainingBlocks;
}
