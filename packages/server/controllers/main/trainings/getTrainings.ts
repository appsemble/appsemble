import { type Context } from 'koa';

import { Training } from '../../../models/index.js';

export async function getTrainings(ctx: Context): Promise<void> {
  const trainings = await Training.findAll();

  ctx.status = 200;
  ctx.body = trainings.map((training) => training.toJSON());
}
