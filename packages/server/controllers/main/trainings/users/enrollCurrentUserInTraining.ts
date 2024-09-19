import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Training, UserTraining } from '../../../../models/index.js';

export async function enrollCurrentUserInTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;

  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const isEnrolled = await UserTraining.findOne({
    where: {
      UserId: user.id,
      TrainingId: trainingId,
    },
  });
  assertKoaError(isEnrolled != null, ctx, 400, 'User is already enrolled in this training');

  await UserTraining.create({
    UserId: user.id,
    TrainingId: trainingId,
    completed: false,
  });

  ctx.status = 201;
}
