import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Training, UserTraining } from '../../../../models/index.js';

export async function setCurrentUserTrainingCompleted(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: { body },
    user,
  } = ctx;
  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const userTraining = await UserTraining.findOne({
    where: {
      UserId: user.id,
      TrainingId: trainingId,
    },
  });

  assertKoaError(!userTraining, ctx, 400, 'User is not enrolled in this training');

  await userTraining.update({
    completed: body.completed,
  });

  ctx.status = 200;
}
