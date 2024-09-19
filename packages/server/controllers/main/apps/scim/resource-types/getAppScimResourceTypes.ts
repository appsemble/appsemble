import { type Context } from 'koa';

import { type ScimListResponse } from '../../../../../types/index.js';
import { getScimResourceType } from '../../../../../utils/scim.js';

export function getAppScimResourceTypes(ctx: Context): void {
  const {
    pathParams: { appId },
  } = ctx;

  const resources: unknown[] = [getScimResourceType(appId)];

  const list: ScimListResponse<unknown> = {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: resources.length,
    Resources: resources,
  };

  ctx.body = list;
}
