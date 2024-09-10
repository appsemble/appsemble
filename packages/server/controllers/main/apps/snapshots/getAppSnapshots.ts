import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppSnapshot, User } from '../../../../models/index.js';

export async function getAppSnapshots(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: {
      model: AppSnapshot,
      attributes: { exclude: ['yaml'] },
      include: [{ model: User, required: false }],
    },
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  ctx.body = app.AppSnapshots.sort((a, b) => b.id - a.id).map((snapshot) => ({
    id: snapshot.id,
    $created: snapshot.created,
    $author: {
      id: snapshot?.User?.id,
      name: snapshot?.User?.name,
    },
  }));
}
