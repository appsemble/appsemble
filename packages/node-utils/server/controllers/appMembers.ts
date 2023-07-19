import { notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';

import { type Options } from '../types.js';

export function createGetAppMember({ getApp, getAppMembers }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, memberId },
    } = ctx;

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    if (!app) {
      throw notFound('App not found');
    }

    if (app.definition.security === undefined) {
      throw notFound('App does not have a security definition');
    }

    const appMembers = await getAppMembers({ context: ctx, app, memberId });

    if (appMembers.length !== 1) {
      throw notFound('App member not found');
    }

    ctx.body = appMembers[0];
  };
}
