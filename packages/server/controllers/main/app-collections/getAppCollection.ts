import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection, OrganizationMember } from '../../../models/index.js';

export async function getAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    user,
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId);

  assertKoaCondition(collection != null, ctx, 404, 'App collection not found');

  const organizationMember = await OrganizationMember.findOne({
    where: {
      UserId: user?.id ?? null,
      OrganizationId: collection.OrganizationId,
    },
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(
    !(collection.visibility === 'private' && !organizationMember),
    ctx,
    403,
    'You are not allowed to see this app collection',
  );

  ctx.response.status = 200;
  ctx.response.body = collection.toJSON();
}
