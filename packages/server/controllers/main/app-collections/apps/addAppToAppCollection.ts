import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { App, AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function addAppToAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    request: { body },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaCondition(collection != null, ctx, 404, 'App collection not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: collection.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppCollections],
  });

  const app = await App.findByPk(body.AppId, { attributes: ['id'] });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

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
