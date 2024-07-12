import { getMessagesUtil, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createGetMessages(options: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, language },
      query: { merge, override = 'true' },
    } = ctx;

    ctx.body = await getMessagesUtil(ctx, language, appId, merge, options, override);
  };
}
