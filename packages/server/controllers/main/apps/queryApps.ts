import { type Context } from 'koa';
import { col, fn, literal } from 'sequelize';

import { App, AppRating, Organization } from '../../../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../../../utils/app.js';

export async function queryApps(ctx: Context): Promise<void> {
  const {
    baseLanguage,
    language,
    query: languageQuery,
  } = parseLanguage(ctx, ctx.query?.language ?? []);

  const apps = await App.findAll({
    attributes: [
      'id',
      'created',
      'updated',
      'definition',
      'path',
      'visibility',
      'template',
      'locked',
      'totp',
      'iconBackground',
      'OrganizationId',
      'googleAnalyticsID',
      'metaPixelID',
      'msClarityID',
      'demoMode',
      'skipGroupInvites',
      'supportedLanguages',
      [literal('"App"."icon" IS NOT NULL'), 'hasIcon'],
      [literal('"App"."maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
    ],
    where: { visibility: 'public' },
    include: [
      {
        model: Organization,
        attributes: [
          'id',
          'name',
          'updated',
          [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
        ],
      },
      ...languageQuery,
    ],
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
  const ratingsByAppId = new Map(ratings.map((rating) => [rating.AppId, rating]));

  ctx.body = apps
    .map((app) => {
      const rating = ratingsByAppId.get(app.id);
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
    .map((app) =>
      Object.assign(app.toJSON(['yaml']), {
        definition: {
          name: app.definition.name,
          description: app.definition.description,
          defaultLanguage: app.definition.defaultLanguage,
        },
      }),
    );
}
