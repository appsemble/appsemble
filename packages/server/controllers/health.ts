import { logger } from '@appsemble/node-utils';
import { serverUnavailable } from '@hapi/boom';
import { Context } from 'koa';

import { getDB } from '../models';
import { getSSLStatus as getSSLStatusImplementation } from '../utils/dns';

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
    throw serverUnavailable('API unhealthy', status);
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
