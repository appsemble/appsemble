import { type Context, type Middleware } from 'koa';

import { getMessagesUtil, type Options } from '../../../../../index.js';

export function createGetAppMessagesController(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, language },
      query: { merge, override = 'true' },
    } = ctx;

    ctx.body = await getMessagesUtil(ctx, language, appId, merge, options, override);
  };
}
