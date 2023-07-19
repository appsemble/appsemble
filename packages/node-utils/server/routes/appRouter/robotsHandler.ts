import { type Context, type Middleware } from 'koa';

export function createRobotsHandler(): Middleware {
  return (ctx: Context) => {
    ctx.body = 'User-agent: *\nAllow: *\n';
  };
}
