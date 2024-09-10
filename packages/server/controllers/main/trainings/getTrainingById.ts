import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Training } from '../../../models/index.js';

export async function getTrainingById(ctx: Context): Promise<void> {
  const {
    pathParams: { trainingId },
  } = ctx;

  const training = await Training.findByPk(trainingId);
  assertKoaError(!training, ctx, 404, 'Training not found');

  ctx.status = 200;
  ctx.body = training;
}
