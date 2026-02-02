import { addDays } from 'date-fns';
import { type Context, type Middleware } from 'koa';

import { assertKoaCondition, type Options } from '../../../index.js';

export function createSecurityHandler({ getApp }: Options): Middleware {
  return async (ctx: Context) => {
    const app = await getApp({ context: ctx, query: { attributes: ['id', 'updated'] } });
    assertKoaCondition(app != null, ctx, 404, 'App not found');
    const expires = addDays(new Date(app.$updated ?? app.$created!), 180);
    ctx.type = 'text/plain; charset=utf-8';
    ctx.body = [
      'Contact: mailto:security@appsemble.com',
      `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
      `Canonical: ${ctx.origin}/.well-known/security.txt`,
      'Policy: https://gitlab.com/appsemble/appsemble/-/blob/main/SECURITY.md',
      'Preferred-Languages: en, nl',
    ].join('\n');
  };
}
