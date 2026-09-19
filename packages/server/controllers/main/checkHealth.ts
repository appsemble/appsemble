import { type Context } from 'koa';

import { getReadiness } from '../../utils/health.js';

/**
 * Deprecated alias of `/health/ready`.
 *
 * @param ctx The Koa context.
 */
export async function checkHealth(ctx: Context): Promise<void> {
  const readiness = await getReadiness();
  ctx.status = readiness.status === 'UP' ? 200 : 503;
  ctx.body = readiness;
}
