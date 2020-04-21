import type { KoaContext } from '../../types';

export default async function robotsHandler(ctx: KoaContext): Promise<void> {
  ctx.body = 'User-agent: *\nAllow: *\n';
}
