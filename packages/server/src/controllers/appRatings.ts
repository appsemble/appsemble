import Boom from '@hapi/boom';

import { App, AppRating, User } from '../models';
import type { KoaContext } from '../types';

interface Params {
  appId: number;
}

export async function getAppRatings(ctx: KoaContext<Params>): Promise<void> {
  const { appId } = ctx.params;

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
  const { appId: AppId } = ctx.params;
  const {
    user: { id: userId },
  } = ctx;
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
