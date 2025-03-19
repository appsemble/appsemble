import { type Context, type Middleware } from 'koa';

import { assertKoaCondition } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';
import { deleteResourcesRecursively } from '../../../../utils/resources.js';

export function createDeleteAppSeedResourcesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
    } = ctx;

    const { getApp } = options;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaCondition(app != null, ctx, 404, 'App not found');

    for (const resourceType of Object.keys(app.definition.resources ?? {})) {
      await deleteResourcesRecursively(resourceType, app, options, ctx);
    }
  };
}
