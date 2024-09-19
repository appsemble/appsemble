import { type Context } from 'koa';

import { type ScimListResponse, type ScimSchema } from '../../../../../types/index.js';
import { getScimLocation, schemas } from '../../../../../utils/scim.js';

export function getAppScimSchemas(ctx: Context): void {
  const {
    pathParams: { appId },
  } = ctx;

  const list: ScimListResponse<ScimSchema> = {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: schemas.length,
    Resources: schemas.map((schema) => ({
      ...schema,
      meta: {
        resourceType: 'Schema',
        location: getScimLocation(appId, `schemas/${schema.id}`),
      },
    })),
  };

  ctx.body = list;
}
