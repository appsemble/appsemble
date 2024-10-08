import { logger, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getDB } from '../../models/index.js';

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
