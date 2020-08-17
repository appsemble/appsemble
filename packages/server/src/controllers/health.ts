import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';

import { getDB } from '../models';
import type { KoaContext } from '../types';

export async function checkHealth(ctx: KoaContext): Promise<void> {
  const status = {
    database: true,
  };

  try {
    await getDB().authenticate();
  } catch (err) {
    logger.error(err);
    status.database = false;
  }

  ctx.body = status;
  if (!Object.values(status).every(Boolean)) {
    throw Boom.serverUnavailable('API unhealthy', status);
  }
}
