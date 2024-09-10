import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppRating, type User } from '../../../../models/index.js';

export async function createAppRating(ctx: Context): Promise<void> {
  const {
    pathParams: { appId: AppId },
    request: {
      body: { description, rating },
    },
    user,
  } = ctx;

  const app = await App.findByPk(AppId, { attributes: ['id'] });
  await (user as User).reload({ attributes: ['name'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const [result] = await AppRating.upsert(
    { rating, description, UserId: user.id, AppId },
    { returning: true },
  );

  ctx.body = {
    rating,
    description,
    UserId: user.id,
    name: user.name,
    $created: result.created,
    $updated: result.updated,
  };
}
