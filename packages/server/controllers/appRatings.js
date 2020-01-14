import Boom from '@hapi/boom';

export async function getAppRatings(ctx) {
  const { appId } = ctx.params;
  const { AppRating, User } = ctx.db.models;

  const ratings = await AppRating.findAll({ where: { AppId: appId }, include: [User], raw: true });
  ctx.body = ratings.map(({ rating, description, UserId, created, updated, ...r }) => ({
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
  const { App, AppRating, User } = ctx.db.models;
  const {
    user: { id: userId },
  } = ctx.state;
  const { rating, description } = ctx.request.body;

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
