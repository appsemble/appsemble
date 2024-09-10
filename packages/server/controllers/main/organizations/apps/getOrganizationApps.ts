import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { col, fn, literal } from 'sequelize';

import { App, AppRating, Organization, User } from '../../../../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../../../../utils/app.js';

export async function getOrganizationApps(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    user,
  } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx, ctx.query?.language);

  const memberInclude = user
    ? { include: [{ model: User, where: { id: user.id }, required: false }] }
    : {};
  const organization = await Organization.findByPk(organizationId, memberInclude);

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  const apps = await App.findAll({
    attributes: {
      include: [[literal('"App".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
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
    where: { OrganizationId: organizationId },
  });

  const filteredApps =
    user && organization.Users.length ? apps : apps.filter((app) => app.visibility === 'public');

  const ratings = await AppRating.findAll({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: filteredApps.map((app) => app.id) },
    group: ['AppId'],
  });

  ctx.body = filteredApps
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
