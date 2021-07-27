import { logger } from '@appsemble/node-utils';
import { serverUnavailable } from '@hapi/boom';
import { Context } from 'koa';

import { getDB } from '../models';

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
