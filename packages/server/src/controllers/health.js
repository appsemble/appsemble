import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';

import { getDB } from '../models';

// eslint-disable-next-line import/prefer-default-export
export async function checkHealth(ctx) {
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
