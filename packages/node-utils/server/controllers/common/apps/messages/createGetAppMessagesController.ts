import { type Context, type Middleware } from 'koa';

import { getMessagesUtil, type Options } from '../../../../../index.js';

export function createGetAppMessagesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, language },
      query: { merge, override = 'true' },
    } = ctx;

    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    ctx.body = await getMessagesUtil(ctx, language, appId, merge, options, override);
  };
}
