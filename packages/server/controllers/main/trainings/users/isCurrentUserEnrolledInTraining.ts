import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Training, UserTraining } from '../../../../models/index.js';

export async function isCurrentUserEnrolledInTraining(ctx: Context): Promise<void> {
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

  if (!isEnrolled) {
    ctx.status = 200;
    ctx.body = {
      enrolled: false,
    };
    return;
  }
  ctx.status = 200;
  ctx.body = {
    enrolled: true,
    completed: isEnrolled.completed,
  };
}
