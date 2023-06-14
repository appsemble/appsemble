import { type Context, type Middleware } from 'koa';

import { type Options } from '../types.js';

export function createGetUserInfo({ getAppUserInfo }: Options): Middleware {
  return async (ctx: Context) => {
    const { client, user } = ctx;
    ctx.body = await getAppUserInfo({ context: ctx, client, user });
  };
}
