import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function unpinAppFromAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId, appId },
  } = ctx;

  const aca = await AppCollectionApp.findOne({
    where: {
      AppCollectionId: appCollectionId,
      AppId: appId,
    },
    include: [
      {
        model: AppCollection,
        attributes: ['OrganizationId'],
      },
    ],
  });

  assertKoaError(!aca, ctx, 404, 'App not found in collection');

  await checkUserPermissions(ctx, aca.AppCollection.OrganizationId, [
    MainPermission.UpdateAppCollections,
  ]);

  await aca.update({
    pinnedAt: null,
  });

  ctx.response.status = 204;
}
