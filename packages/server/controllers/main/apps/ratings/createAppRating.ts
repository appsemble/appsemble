import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppRating, User } from '../../../../models/index.js';

export async function createAppRating(ctx: Context): Promise<void> {
  const {
    pathParams: { appId: AppId },
    request: {
      body: { description, rating },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(AppId, { attributes: ['id'] });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const user = await User.findByPk(authSubject.id, { attributes: ['id', 'name'] });

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
