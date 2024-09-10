import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Training } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function createTraining(ctx: Context): Promise<void> {
  const {
    request: {
      body: { competences, description, difficultyLevel, title },
    },
  } = ctx;

  await checkRole(ctx, 'appsemble', Permission.CreateApps);
  const training = await Training.create({
    title,
    description,
    competences,
    difficultyLevel,
  });
  ctx.status = 201;
  ctx.body = training.toJSON();
}
