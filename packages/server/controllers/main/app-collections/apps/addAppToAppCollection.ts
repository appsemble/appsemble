import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { App, AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function addAppToAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(body.AppId, { attributes: ['id'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaError(!collection, ctx, 404, 'App collection not found');

  await checkUserPermissions(ctx, collection.OrganizationId, [MainPermission.UpdateAppCollections]);

  try {
    await AppCollectionApp.create({
      AppCollectionId: collection.id,
      AppId: app.id,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, 'App already in collection');
    }
    throw error;
  }

  ctx.response.status = 204;
}
