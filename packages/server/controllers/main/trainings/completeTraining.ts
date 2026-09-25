import { assertKoaCondition, getValidTrainings } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { TrainingCompleted } from '../../../models/index.js';

export async function completeTraining(ctx: Context): Promise<void> {
  const { user } = ctx;
  const trainingId = String(ctx.pathParams.trainingId);

  const trainingIds = await getValidTrainings('trainings');
  assertKoaCondition(trainingIds.includes(trainingId), ctx, 404, 'Training not found');

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
