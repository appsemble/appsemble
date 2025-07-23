import { type Context } from 'node:vm';

import { Training } from '../../../models/main/Training.js';

export async function getTrainingIds(ctx: Context): Promise<void> {
  ctx.status = 200;
  ctx.body = await Training.findAll({ attributes: ['id'] }).then((entries) =>
    entries.map((entry) => entry.id),
  );
}
