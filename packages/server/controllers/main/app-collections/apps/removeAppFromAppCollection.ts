import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function removeAppFromAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId, appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaError(!collection, ctx, 404, 'Collection not found');

  await checkUserPermissions(ctx, collection.OrganizationId, [MainPermission.UpdateAppCollections]);

  await AppCollectionApp.destroy({
    where: {
      AppCollectionId: collection.id,
      AppId: app.id,
    },
  });

  ctx.response.status = 204;
}
