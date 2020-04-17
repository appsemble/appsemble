import type { Context } from 'koa';

export default async function robotsHandler(ctx: Context): Promise<void> {
  ctx.body = 'User-agent: *\nAllow: *\n';
}
