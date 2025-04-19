import { type Context } from 'koa';

import { TrainingCompleted } from '../../../models/index.js';

export async function resetTrainingProgress(ctx: Context): Promise<void> {
  const { user } = ctx;

  await TrainingCompleted.destroy({
    where: {
      UserId: user!.id,
    },
  });

  ctx.status = 204;
}
