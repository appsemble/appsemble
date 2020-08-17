import type { KoaContext } from '../../types';

export function robotsHandler(ctx: KoaContext): void {
  ctx.body = 'User-agent: *\nAllow: *\n';
}
