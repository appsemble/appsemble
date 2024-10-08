import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Training, TrainingBlock } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function createTrainingBlock(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
    request: {
      body: { documentationLink, exampleCode, externalResource, title, videoLink },
    },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: 'appsemble',
    requiredPermissions: [OrganizationPermission.CreateTrainingBlocks],
  });

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
