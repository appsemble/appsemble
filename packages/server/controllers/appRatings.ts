import { notFound } from '@hapi/boom';
import { Context } from 'koa';

import { App, AppRating, User } from '../models/index.js';

export async function getAppRatings(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const ratings = await AppRating.findAll({ where: { AppId: appId }, include: [User] });
  ctx.body = ratings.map(({ UserId, created, description, rating, updated, ...r }) => ({
    rating,
    description,
    UserId,
    name: r.User.name,
    $created: created,
    $updated: updated,
  }));
}

export async function submitAppRating(ctx: Context): Promise<void> {
  const {
    pathParams: { appId: AppId },
    request: {
      body: { description, rating },
    },
    user,
  } = ctx;

  const app = await App.findByPk(AppId, { attributes: ['id'] });
  await user.reload({ attributes: ['name'] });

  if (!app) {
    throw notFound('App not found');
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
