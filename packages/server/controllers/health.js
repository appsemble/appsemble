import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';
import nodemailer from 'nodemailer';

// eslint-disable-next-line import/prefer-default-export
export async function checkHealth(ctx) {
  const { db } = ctx;
  const { smtp } = ctx.state;

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

  const transport = nodemailer.createTransport(smtp);
  try {
    await transport.verify();
  } catch (err) {
    logger.error(err);
    status.smtp = false;
  }

  ctx.body = status;
  if (!Object.values(status).every(Boolean)) {
    throw Boom.serverUnavailable('API unhealthy', status);
  }
}
