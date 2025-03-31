import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppCollection, AppCollectionApp } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

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

  assertKoaCondition(aca != null, ctx, 404, 'App not found in collection');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: aca.AppCollection!.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppCollections],
  });

  await aca.update({
    pinnedAt: null,
  });

  ctx.response.status = 204;
}
