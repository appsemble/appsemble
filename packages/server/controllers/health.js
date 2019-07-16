import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';

// eslint-disable-next-line import/prefer-default-export
export async function checkHealth(ctx) {
  const { db, mailer } = ctx;

  const status = {
    database: true,
    smtp: true,
  };

  try {
    await db.authenticate();
  } catch (err) {
    logger.error(err);
    status.database = false;
  }

  try {
    await mailer.verify();
  } catch (err) {
    logger.error(err);
    status.smtp = false;
  }

  ctx.body = status;
  if (!Object.values(status).every(Boolean)) {
    throw Boom.serverUnavailable('API unhealthy', status);
  }
}
