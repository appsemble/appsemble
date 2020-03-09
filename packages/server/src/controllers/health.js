import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';

// eslint-disable-next-line import/prefer-default-export
export async function checkHealth(ctx) {
  const { db } = ctx;

  const status = {
    database: true,
  };

  try {
    await db.authenticate();
  } catch (err) {
    logger.error(err);
    status.database = false;
  }

  ctx.body = status;
  if (!Object.values(status).every(Boolean)) {
    throw Boom.serverUnavailable('API unhealthy', status);
  }
}
