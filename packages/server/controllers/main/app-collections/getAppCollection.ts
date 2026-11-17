import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection } from '../../../models/index.js';
import { getOrganizationMemberAccess } from '../../../utils/organizationSso.js';

export async function getAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId);

  assertKoaCondition(collection != null, ctx, 404, 'App collection not found');

  const organizationMember = await getOrganizationMemberAccess(ctx, collection.OrganizationId);

  assertKoaCondition(
    !(collection.visibility === 'private' && !organizationMember),
    ctx,
    403,
    'You are not allowed to see this app collection',
  );

  ctx.response.status = 200;
  ctx.response.body = collection.toJSON();
}
