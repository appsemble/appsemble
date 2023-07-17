import { Permission } from '@appsemble/utils';
import { conflict, notFound } from '@hapi/boom';
import { type Context } from 'koa';
import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';

import { App } from '../models/App.js';
import { AppCollection } from '../models/AppCollection.js';
import { AppCollectionApp } from '../models/AppCollectionApp.js';
import { AppRating, Member, Organization } from '../models/index.js';
import { compareApps } from '../utils/app.js';
import { checkRole } from '../utils/checkRole.js';

export async function queryCollections(ctx: Context): Promise<void> {
  const memberships = await Member.findAll({
    where: {
      UserId: ctx.user?.id ?? null,
    },
    attributes: ['OrganizationId'],
  });
  const collections = await AppCollection.findAll({
    include: [
      {
        model: Organization,
        attributes: ['name'],
      },
    ],
    where: {
      [Op.or]: [
        {
          visibility: 'public',
        },
        {
          OrganizationId: {
            [Op.in]: memberships.map((membership) => membership.OrganizationId),
          },
        },
      ],
    },
    order: [['updated', 'DESC']],
  });

  ctx.response.status = 200;
  ctx.response.body = collections.map((collection) => collection.toJSON());
}

export async function queryOrganizationCollections(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const isUserMember =
    (await Member.count({
      where: {
        UserId: ctx.user?.id ?? null,
        OrganizationId: organizationId,
      },
    })) > 0;
  const collections = await AppCollection.findAll({
    include: [
      {
        model: Organization,
      },
    ],
    where: {
      OrganizationId: organizationId,
      ...(isUserMember ? {} : { visibility: 'public' }),
    },
    order: [['updated', 'DESC']],
  });

  ctx.response.status = 200;
  ctx.response.body = collections.map((collection) => collection.toJSON());
}

export async function getCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    user,
  } = ctx;
  const collection = await AppCollection.findByPk(appCollectionId);

  const memberships = await Member.findAll({
    where: {
      UserId: user?.id ?? null,
    },
    attributes: ['OrganizationId'],
  });

  if (
    !collection ||
    (collection.visibility === 'private' &&
      !memberships.some((membership) => membership.OrganizationId === collection.OrganizationId))
  ) {
    throw notFound('Collection not found');
  }

  ctx.response.status = 200;
  ctx.response.body = collection.toJSON();
}

export async function deleteCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  if (!collection) {
    throw notFound('Collection not found');
  }

  await checkRole(ctx, collection.OrganizationId, Permission.DeleteCollections);

  await collection.destroy();

  ctx.response.status = 204;
  ctx.response.body = null;
}

export async function createCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: { body },
  } = ctx;

  await checkRole(ctx, organizationId, Permission.CreateCollections);

  const collection = await AppCollection.create({
    name: body.name,
    expertName: body.expertName,
    expertDescription: body.expertDescription,
    expertProfileImage: body.expertProfileImage.contents,
    expertProfileImageMimeType: body.expertProfileImage.mime,
    headerImage: body.headerImage.contents,
    headerImageMimeType: body.headerImage.mime,
    OrganizationId: organizationId,
    visibility: body.visibility ?? 'public',
  });

  await collection.reload({
    include: [
      {
        model: Organization,
        attributes: ['name'],
      },
    ],
  });

  ctx.response.status = 201;
  ctx.response.body = collection.toJSON();
}

export async function queryCollectionApps(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    user,
  } = ctx;

  const memberships = await Member.findAll({
    where: {
      UserId: user?.id ?? null,
    },
    attributes: ['OrganizationId'],
  });

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId', 'visibility'],
  });

  if (
    !collection ||
    (collection.visibility === 'private' &&
      !memberships.some((membership) => membership.OrganizationId === collection.OrganizationId))
  ) {
    throw notFound('Collection not found');
  }

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
              ],
              where: {
                [Op.or]: [
                  {
                    visibility: 'public',
                  },
                  {
                    OrganizationId: {
                      [Op.in]: memberships.map((membership) => membership.OrganizationId),
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    })
  )?.Apps.map((app) => app.App);

  if (!apps) {
    throw notFound('Collection not found');
  }

  const ratingsMap = new Map(
    (
      await AppRating.findAll({
        attributes: [
          'AppId',
          [fn('AVG', col('rating')), 'RatingAverage'],
          [fn('COUNT', col('AppId')), 'RatingCount'],
        ],
        where: { AppId: apps.map((app) => app.id) },
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
    .map((app) => {
      const rating = ratingsMap.get(app.id);
      if (rating) {
        Object.assign(app, {
          RatingAverage: rating.average,
          RatingCount: rating.count,
        });
      }
      return app;
    })
    .sort(compareApps)
    .map((app) => app.toJSON(['yaml']));
}

export async function addAppToCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(body.AppId, { attributes: ['id'] });

  if (!app) {
    throw notFound('App not found');
  }

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  if (!collection) {
    throw notFound('Collection not found');
  }

  await checkRole(ctx, collection.OrganizationId, Permission.EditCollections);

  try {
    await AppCollectionApp.create({
      AppCollectionId: collection.id,
      AppId: app.id,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw conflict('App already in collection');
    }
    throw error;
  }

  ctx.response.status = 204;
}

export async function removeAppFromCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId, appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id'] });

  if (!app) {
    throw notFound('App not found');
  }

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  if (!collection) {
    throw notFound('Collection not found');
  }

  await checkRole(ctx, collection.OrganizationId, Permission.EditCollections);

  await AppCollectionApp.destroy({
    where: {
      AppCollectionId: collection.id,
      AppId: app.id,
    },
  });

  ctx.response.status = 204;
}

export async function getCollectionHeaderImage(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['headerImage', 'headerImageMimeType'],
  });

  if (!collection) {
    throw notFound('Collection not found');
  }

  ctx.response.status = 200;
  ctx.response.body = collection.headerImage;
  ctx.type = collection.headerImageMimeType;
}

export async function getCollectionExpertProfileImage(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['expertProfileImage', 'expertProfileImageMimeType'],
  });

  if (!collection) {
    throw notFound('Collection not found');
  }

  ctx.response.status = 200;
  ctx.response.body = collection.expertProfileImage;
  ctx.type = collection.expertProfileImageMimeType;
}

export async function updateCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    request: { body },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    include: [{ model: Organization, attributes: ['name'] }],
  });

  if (!collection) {
    throw notFound('Collection not found');
  }

  await checkRole(ctx, collection.OrganizationId, Permission.EditCollections);

  const updatedCollection = await collection.update({
    name: body.name ?? undefined,
    expertName: body.expertName ?? undefined,
    expertDescription: body.expertDescription ?? undefined,
    expertProfileImage: body.expertProfileImage?.contents ?? undefined,
    expertProfileImageMimeType: body.expertProfileImage?.mime ?? undefined,
    headerImage: body.headerImage?.contents ?? undefined,
    headerImageMimeType: body.headerImage?.mime ?? undefined,
    visibility: body.visibility ?? undefined,
  });
  ctx.response.status = 200;
  ctx.response.body = updatedCollection.toJSON();
}
