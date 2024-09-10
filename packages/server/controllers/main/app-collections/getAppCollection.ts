import { throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection, OrganizationMember } from '../../../models/index.js';

export async function getAppCollection(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
    user,
  } = ctx;
  const collection = await AppCollection.findByPk(appCollectionId);

  const memberships = await OrganizationMember.findAll({
    where: {
      UserId: user?.id ?? null,
    },
    attributes: ['OrganizationId'],
  });

  if (
    !collection ||
    (collection.visibility === 'private' &&
      !memberships.some((membership) => membership.OrganizationId === collection.OrganizationId))
  ) {
    throwKoaError(ctx, 404, 'Collection not found');
  }

  ctx.response.status = 200;
  ctx.response.body = collection.toJSON();
}
