import { notFound } from '@hapi/boom';

import { App, AppRating, User } from '../models';
import { KoaContext } from '../types';

interface Params {
  appId: number;
}

export async function getAppRatings(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
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

export async function submitAppRating(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId: AppId },
    request: {
      body: { description, rating },
    },
    user: { id: UserId },
  } = ctx;

  const app = await App.findByPk(AppId);
  const user = await User.findByPk(UserId);

  if (!app) {
    throw notFound('App not found');
  }

  const [result] = await AppRating.upsert(
    { rating, description, UserId, AppId },
    { returning: true },
  );

  ctx.body = {
    rating,
    description,
    UserId,
    name: user.name,
    $created: result.created,
    $updated: result.updated,
  };
}
