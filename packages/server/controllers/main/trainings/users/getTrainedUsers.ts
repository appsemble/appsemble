import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Training, User, UserTraining } from '../../../../models/index.js';

export async function getTrainedUsers(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    user,
  } = ctx;

  assertKoaError(!user, ctx, 401, 'User is not logged in');

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const enrolledUsers = await UserTraining.findAll({
    where: { TrainingId: trainingId, completed: true },
    include: User,
  });
  ctx.status = 200;
  ctx.body = enrolledUsers;
}
