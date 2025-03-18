import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function removeAppFromAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId, appId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaCondition(collection != null, ctx, 404, 'Collection not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: collection.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppCollections],
  });

  const app = await App.findByPk(appId, { attributes: ['id'] });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await AppCollectionApp.destroy({
    where: {
      AppCollectionId: collection.id,
      AppId: app.id,
    },
  });

  ctx.response.status = 204;
}
