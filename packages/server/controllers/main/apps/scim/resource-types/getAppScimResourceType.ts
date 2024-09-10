import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getScimResourceType } from '../../../../../utils/scim.js';

export function getAppScimResourceType(ctx: Context): void {
  const {
    pathParams: { appId, resourceTypeId },
  } = ctx;

  scimAssert(resourceTypeId === 'User', ctx, 404, 'ResourceType not found');

  ctx.body = getScimResourceType(appId);
}
