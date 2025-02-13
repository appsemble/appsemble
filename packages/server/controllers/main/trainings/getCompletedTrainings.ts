import { type Context } from 'koa';

import { TrainingCompleted } from '../../../models/index.js';

export async function getCompletedTrainings(ctx: Context): Promise<void> {
  const { user } = ctx;

  const trainings =
    user == null
      ? []
      : await TrainingCompleted.findAll({ where: { UserId: user.id } }).then((entries) =>
          entries.map((entry) => entry.TrainingId),
        );

  ctx.status = 200;
  ctx.body = trainings;
}
