import { getValidTrainings } from '@appsemble/node-utils';
import { type Context } from 'koa';

export async function getTrainingIds(ctx: Context): Promise<void> {
  ctx.status = 200;
  ctx.body = await getValidTrainings('trainings');
}
