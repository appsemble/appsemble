import { type Context } from 'koa';
import { col, fn, literal, Op } from 'sequelize';

import { App, AppRating, Organization, OrganizationMember } from '../../../../../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../../../../../utils/app.js';

export async function queryCurrentUserApps(ctx: Context): Promise<void> {
  const user = ctx.user!;
  const {
    baseLanguage,
    language,
    query: languageQuery,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const memberships = await OrganizationMember.findAll({
    attributes: ['OrganizationId'],
    raw: true,
    where: { UserId: user.id },
  });

  const apps = await App.findAll({
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
    },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      ...languageQuery,
    ],
    where: { OrganizationId: { [Op.in]: memberships.map((m) => m.OrganizationId) } },
  });

  const ratings = await AppRating.findAll({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: apps.map((app) => app.id) },
    group: ['AppId'],
  });

  ctx.body = apps
    .map((app) => {
      const rating = ratings.find((r) => r.AppId === app.id);

      if (rating) {
        Object.assign(app, {
          RatingAverage: Number(rating.get('RatingAverage')),
          RatingCount: Number(rating.get('RatingCount')),
        });
      }

      applyAppMessages(app, language, baseLanguage);

      return app;
    })
    .sort(compareApps)
    .map((app) => app.toJSON(['yaml']));
}
