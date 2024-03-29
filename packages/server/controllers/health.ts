import { logger, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getDB } from '../models/index.js';
import { getSSLStatus as getSSLStatusImplementation } from '../utils/dns/index.js';

export async function checkHealth(ctx: Context): Promise<void> {
  const status = {
    database: true,
  };

  try {
    await getDB().authenticate();
  } catch (err: unknown) {
    logger.error(err);
    status.database = false;
  }

  ctx.body = status;
  if (!Object.values(status).every(Boolean)) {
    throwKoaError(ctx, 503, 'API unhealthy', {
      database: false,
    });
  }
}

export async function getSSLStatus(ctx: Context): Promise<void> {
  const {
    queryParams: { domains },
  } = ctx;

  ctx.body = await getSSLStatusImplementation(domains);
}

export function getTimezones(ctx: Context): void {
  ctx.body = Intl.supportedValuesOf('timeZone');
}
