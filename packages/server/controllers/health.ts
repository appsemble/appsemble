import { logger } from '@appsemble/node-utils';
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
    ctx.response.status = 503;
    ctx.response.body = {
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'API unhealthy',
      data: {
        database: false,
      },
    };
    ctx.throw();
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
