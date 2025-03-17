import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection } from '../../../models/index.js';

export async function getAppCollectionExpertProfileImage(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['expertProfileImage', 'expertProfileImageMimeType'],
  });

  assertKoaCondition(!!collection, ctx, 404, 'Collection not found');

  ctx.response.status = 200;
  ctx.response.body = collection.expertProfileImage;
  ctx.type = collection.expertProfileImageMimeType;
}
