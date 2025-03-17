import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { col, fn, literal } from 'sequelize';

import { App, AppRating, Organization, OrganizationMember } from '../../../../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../../../../utils/app.js';

export async function getOrganizationApps(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    user: authSubject,
  } = ctx;

  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx, ctx.query?.language);

  const organization = await Organization.findByPk(organizationId);

  assertKoaCondition(!!organization, ctx, 404, 'Organization not found.');
  let organizationMember;

  if (authSubject) {
    organizationMember = await OrganizationMember.findOne({
      where: {
        UserId: authSubject.id,
        OrganizationId: organizationId,
      },
    });
  }

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
    where: {
      OrganizationId: organizationId,
      ...(organizationMember ? {} : { visibility: 'public' }),
    },
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
