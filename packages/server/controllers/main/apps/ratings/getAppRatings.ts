import { type Context } from 'koa';

import { AppRating, User } from '../../../../models/index.js';

export async function getAppRatings(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const ratings = await AppRating.findAll({ where: { AppId: appId }, include: [User] });
  ctx.body = ratings.map(({ UserId, created, description, rating, updated, ...r }) => ({
    rating,
    description,
    UserId,
    name: r.User!.name,
    $created: created,
    $updated: updated,
  }));
}
