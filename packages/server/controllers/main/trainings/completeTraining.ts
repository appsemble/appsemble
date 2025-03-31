import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Training, TrainingCompleted } from '../../../models/index.js';

export async function completeTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;

  const training = await Training.findByPk(trainingId);
  assertKoaCondition(training != null, ctx, 404, 'Training not found');

  const alreadyCompleted = await TrainingCompleted.findOne({
    where: { TrainingId: trainingId, UserId: user?.id },
  });
  assertKoaCondition(alreadyCompleted == null, ctx, 409, 'Training has already been completed');

  await TrainingCompleted.create({
    TrainingId: trainingId,
    UserId: user?.id,
  });

  ctx.status = 201;
}
