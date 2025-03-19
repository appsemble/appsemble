import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection } from '../../../models/index.js';

export async function getAppCollectionHeaderImage(ctx: Context): Promise<void> {
  const {
    pathParams: { appCollectionId },
  } = ctx;

  const collection = await AppCollection.findByPk(appCollectionId, {
    attributes: ['headerImage', 'headerImageMimeType'],
  });

  assertKoaCondition(collection != null, ctx, 404, 'Collection not found');

  ctx.response.status = 200;
  ctx.response.body = collection.headerImage;
  ctx.type = collection.headerImageMimeType;
}
