import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppCollection } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaError(!collection, ctx, 404, 'Collection not found');

  await checkRole(ctx, collection.OrganizationId, Permission.DeleteCollections);

  await collection.destroy();

  ctx.response.status = 204;
  ctx.response.body = null;
}
