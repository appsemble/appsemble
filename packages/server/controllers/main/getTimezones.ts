import { type Context } from 'koa';

export function getTimezones(ctx: Context): void {
  ctx.body = Intl.supportedValuesOf('timeZone');
}
