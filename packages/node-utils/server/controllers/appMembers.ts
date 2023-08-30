import { type Context, type Middleware } from 'koa';

import { type Options } from '../types.js';

export function createGetAppMember({ getApp, getAppMembers }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, memberId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    if (!app) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'App not found',
      };
      ctx.throw();
    }

    if (app.definition.security === undefined) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'App does not have a security definition',
      };
      ctx.throw();
    }

    const appMembers = await getAppMembers({ context: ctx, app, memberId });

    if (appMembers.length !== 1) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'App member not found',
      };
      ctx.throw();
    }

    ctx.body = appMembers[0];
  };
}
