import { type Context, type Middleware } from 'koa';

import { assertKoaCondition } from '../../../../../koa.js';
import { type Options } from '../../../../types.js';

export function createGetAppVariablesController({ getApp, getAppVariables }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaCondition(!!app, ctx, 404, 'App not found');

    ctx.body = await getAppVariables({
      context: ctx,
      app,
      query: { attributes: ['id', 'name', 'value'] },
    });
  };
}
