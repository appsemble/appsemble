import { type Context } from 'koa';

import { getSSLStatus as getSSLStatusImplementation } from '../../utils/dns/index.js';

export async function getSslStatus(ctx: Context): Promise<void> {
  const {
    queryParams: { domains },
  } = ctx;

  ctx.body = await getSSLStatusImplementation(domains);
}
