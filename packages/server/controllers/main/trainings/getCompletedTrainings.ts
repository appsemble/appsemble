import { getValidTrainings } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { TrainingCompleted } from '../../../models/index.js';

export async function getCompletedTrainings(ctx: Context): Promise<void> {
  const { user } = ctx;

  const validTrainingIds = new Set(await getValidTrainings('trainings'));
  const trainings =
    user == null
      ? []
      : await TrainingCompleted.findAll({ where: { UserId: user.id } }).then((entries) =>
          entries.map((entry) => entry.TrainingId).filter((id) => validTrainingIds.has(id)),
        );

  ctx.status = 200;
  ctx.body = trainings;
}
