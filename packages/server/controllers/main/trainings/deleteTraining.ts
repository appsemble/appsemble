import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Training, TrainingBlock, UserTraining } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.DeleteApps);

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  const trainingBlocks = await TrainingBlock.findAll({
    where: { TrainingId: trainingId },
  });

  trainingBlocks.map(async (trainingBlock) => {
    await trainingBlock.destroy();
  });
  await UserTraining.destroy({ where: { TrainingId: trainingId } });
  await training.destroy();

  ctx.status = 204;
}
