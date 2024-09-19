import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Training, TrainingBlock, UserTraining } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteTraining(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: 'appsemble',
    requiredPermissions: [OrganizationPermission.DeleteTrainings],
  });

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
