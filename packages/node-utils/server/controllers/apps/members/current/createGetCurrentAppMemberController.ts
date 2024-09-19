import { type Context, type Middleware } from 'koa';

import { type Options } from '../../../../types.js';

export function createGetCurrentAppMemberController({ getCurrentAppMember }: Options): Middleware {
  return async (ctx: Context) => {
    ctx.body = await getCurrentAppMember({ context: ctx });
  };
}
