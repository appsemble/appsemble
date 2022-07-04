import { Context } from 'koa';

export function robotsHandler(ctx: Context): void {
  ctx.body = 'User-agent: *\nAllow: *\n';
}
