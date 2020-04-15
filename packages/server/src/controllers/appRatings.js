import Boom from '@hapi/boom';

import { App, AppRating, User } from '../models';

export async function getAppRatings(ctx) {
  const { appId } = ctx.params;

  const ratings = await AppRating.findAll({ where: { AppId: appId }, include: [User], raw: true });
  ctx.body = ratings.map(({ UserId, created, description, rating, updated, ...r }) => ({
    rating,
    description,
    UserId,
    name: r['User.name'],
    $created: created,
    $updated: updated,
  }));
}

export async function submitAppRating(ctx) {
  const { appId: AppId } = ctx.params;
  const {
    user: { id: userId },
  } = ctx.state;
  const { description, rating } = ctx.request.body;

  const app = await App.findByPk(AppId);
  const user = await User.findByPk(userId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

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
