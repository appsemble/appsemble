import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppCollection } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaError(!collection, ctx, 404, 'Collection not found');

  await checkUserOrganizationPermissions(ctx, collection.OrganizationId, [
    OrganizationPermission.DeleteAppCollections,
  ]);

  await collection.destroy();

  ctx.response.status = 204;
  ctx.response.body = null;
}
