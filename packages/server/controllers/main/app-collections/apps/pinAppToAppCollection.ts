import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function pinAppToAppCollection(ctx: Context): Promise<void> {
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

  await checkRole(ctx, aca.AppCollection.OrganizationId, Permission.EditCollections);

  const pinnedAt = new Date();
  await aca.update({
    pinnedAt,
  });

  ctx.response.status = 200;
  ctx.response.body = { pinnedAt };
}
