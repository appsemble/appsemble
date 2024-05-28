import { type Context, type Middleware } from 'koa';

import { assertKoaError } from '../../koa.js';
import { type Options } from '../types.js';

export function createGetAppVariables({ getApp, getAppVariables }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    assertKoaError(!app, ctx, 404, 'App not found');

    const variables = await getAppVariables({
      context: ctx,
      app,
      query: { attributes: ['id', 'name', 'value'] },
    });

    ctx.body = variables;
  };
}
