import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Training } from '../../../models/index.js';
import { checkUserPermissions } from '../../../utils/authorization.js';

export async function createTraining(ctx: Context): Promise<void> {
  const {
    request: {
      body: { competences, description, difficultyLevel, title },
    },
  } = ctx;

  await checkUserPermissions(ctx, 'appsemble', [MainPermission.CreateTrainings]);
  const training = await Training.create({
    title,
    description,
    competences,
    difficultyLevel,
  });
  ctx.status = 201;
  ctx.body = training.toJSON();
}
