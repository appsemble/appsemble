import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { col, fn, literal, Op } from 'sequelize';

import {
  App,
  AppCollection,
  AppCollectionApp,
  AppMessages,
  AppRating,
  Organization,
  OrganizationMember,
} from '../../../../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../../../../utils/app.js';

export async function queryAppCollectionApps(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    user,
  } = ctx;
  const { baseLanguage, language } = parseLanguage(ctx, ctx.query?.language ?? []);

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId', 'visibility'],
  });

  assertKoaCondition(collection != null, ctx, 404, 'App collection not found');

  const organizationMember = await OrganizationMember.findOne({
    where: {
      UserId: user?.id ?? null,
      OrganizationId: collection.OrganizationId,
    },
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(
    !(collection.visibility === 'private' && !organizationMember),
    ctx,
    403,
    'You are not allowed to see this app collection',
  );

  const apps = (
    await AppCollection.findByPk(appCollectionId, {
      include: [
        {
          model: AppCollectionApp,
          include: [
            {
              model: App,
              attributes: {
                exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
                include: [
                  [literal('"Apps->App"."icon" IS NOT NULL'), 'hasIcon'],
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
                      [literal('"Apps->App->Organization"."icon" IS NOT NULL'), 'hasIcon'],
                    ],
                  },
                },
                {
                  model: AppMessages,
                },
              ],
              where: {
                [Op.or]: [
                  {
                    visibility: 'public',
                  },
                  ...(organizationMember?.OrganizationId
                    ? [{ OrganizationId: organizationMember.OrganizationId }]
                    : []),
                ],
              },
            },
          ],
        },
      ],
    })
  )?.Apps;

  assertKoaCondition(apps != null, ctx, 404, 'App collection apps not found');

  const ratingsMap = new Map(
    (
      await AppRating.findAll({
        attributes: [
          'AppId',
          [fn('AVG', col('rating')), 'RatingAverage'],
          [fn('COUNT', col('AppId')), 'RatingCount'],
        ],
        where: { AppId: apps.map((app) => app.App!.id) },
        group: ['AppId'],
      })
    ).map((rating) => [
      rating.AppId,
      {
        average: Number(rating.get('RatingAverage')),
        count: Number(rating.get('RatingCount')),
      },
    ]),
  );

  ctx.response.status = 200;
  ctx.response.body = apps
    .map(({ App: app, pinnedAt }) => {
      const rating = ratingsMap.get(app!.id);
      if (rating) {
        Object.assign(app!, {
          RatingAverage: rating.average,
          RatingCount: rating.count,
        });
      }
      applyAppMessages(app!, language, baseLanguage);
      return { app: app!, pinnedAt };
    })
    .sort(({ app: app1, pinnedAt: pinnedAt1 }, { app: app2, pinnedAt: pinnedAt2 }) => {
      if (pinnedAt1 && !pinnedAt2) {
        return -1;
      }
      if (!pinnedAt1 && pinnedAt2) {
        return 1;
      }
      if (pinnedAt1 && pinnedAt2) {
        return pinnedAt2.getTime() - pinnedAt1.getTime();
      }
      return compareApps(app1, app2);
    })
    .map(({ app, pinnedAt }) => Object.assign(app.toJSON(['yaml']), { pinnedAt }));
}
