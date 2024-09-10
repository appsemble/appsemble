import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { Training, TrainingBlock } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function createTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: {
      body: { documentationLink, exampleCode, externalResource, title, videoLink },
    },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permissions.CreateApps);

  const parentTraining = await Training.findByPk(trainingId);
  assertKoaError(!parentTraining, ctx, 404, 'Training not found');

  await TrainingBlock.create({
    TrainingId: trainingId,
    title,
    documentationLink,
    videoLink,
    exampleCode,
    externalResource,
  });
  ctx.status = 201;
}
