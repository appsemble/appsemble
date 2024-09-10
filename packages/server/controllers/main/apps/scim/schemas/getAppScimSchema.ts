import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getScimLocation, schemas } from '../../../../../utils/scim.js';

export function getAppScimSchema(ctx: Context): void {
  const {
    pathParams: { appId, schemaId },
  } = ctx;

  const schema = schemas.find((s) => s.id === schemaId);
  scimAssert(schema, ctx, 404, 'Schema not found');

  ctx.body = {
    ...schema,
    meta: {
      resourceType: 'Schema',
      location: getScimLocation(appId, `schemas/${schema.id}`),
    },
  };
}
