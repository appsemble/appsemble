import { assertKoaError, logger } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, Asset, Resource } from '../../../models/index.js';
import { assetsCache } from '../../../utils/assetCache.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { reseedResourcesRecursively } from '../../../utils/resource.js';

export async function reseedDemoApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['demoMode', 'definition', 'OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.demoMode, ctx, 400, 'App is not in demo mode');

  logger.info('Cleaning up ephemeral assets.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [
      OrganizationPermission.DeleteAppAssets,
      OrganizationPermission.DeleteAppResources,
      OrganizationPermission.CreateAppAssets,
      OrganizationPermission.CreateAppResources,
    ],
  });
  const demoAssetsToDelete = await Asset.findAll({
    attributes: ['id'],
    where: {
      ephemeral: true,
      AppId: appId,
    },
  });
  assetsCache.del(demoAssetsToDelete.map((asset) => `${appId}-${asset.id}`));

  const demoAssetsDeletionResult = await Asset.destroy({
    where: {
      id: { [Op.in]: demoAssetsToDelete.map((asset) => asset.id) },
    },
  });

  logger.info(`Removed ${demoAssetsDeletionResult} ephemeral assets.`);

  const demoAssetsToReseed = await Asset.findAll({
    attributes: ['mime', 'filename', 'data', 'name', 'AppId', 'ResourceId'],
    include: [
      {
        model: App,
        attributes: ['id'],
        where: {
          id: appId,
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      seed: true,
    },
  });

  logger.info('Reseeding ephemeral assets.');

  for (const asset of demoAssetsToReseed) {
    await Asset.create({
      ...asset.dataValues,
      ephemeral: true,
      seed: false,
    });
  }

  logger.info(`Reseeded ${demoAssetsToReseed.length} ephemeral assets.`);

  const date = new Date();

  logger.info(
    `Cleaning up ephemeral resources and resources with an expiry date earlier than ${date.toISOString()}.`,
  );

  const demoResourcesDeletionResult = await Resource.destroy({
    where: {
      [Op.or]: [{ seed: false, expires: { [Op.lt]: date } }, { ephemeral: true }],
      [Op.and]: { AppId: appId },
    },
  });

  logger.info(`Removed ${demoResourcesDeletionResult} ephemeral resources.`);

  const demoResourcesToReseed = await Resource.findAll({
    attributes: ['type', 'data', 'AppId', 'AuthorId'],
    include: [
      {
        model: App,
        attributes: ['definition'],
        where: {
          id: appId,
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      seed: true,
    },
  });

  logger.info('Reseeding ephemeral resources.');

  await reseedResourcesRecursively(app.definition, demoResourcesToReseed);

  logger.info(`Reseeded ${demoResourcesToReseed.length} ephemeral resources.`);
}
