import { logger, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getDB } from '../../models/index.js';
import { argv } from '../../utils/argv.js';
import { getValkeyClient } from '../../utils/valkey.js';

export async function checkHealth(ctx: Context): Promise<void> {
  const status: { database: boolean; valkey?: boolean } = {
    database: true,
  };

  try {
    await getDB().authenticate();
  } catch (err: unknown) {
    logger.error(err);
    status.database = false;
  }

  if (argv.valkeyHost) {
    status.valkey = true;
    try {
      const client = getValkeyClient();
      const message = `Valkey health check at ${new Date().toISOString()}`;
      const response = await client?.ping(message);
      logger.silly(`Valkey responded to health check with: ${JSON.stringify(response)}`);
      if (!response) {
        throw new Error('Valkey did not respond to health check');
      }
      // Why would this ever happen? Just in case, to be absolutely sure
      if (response !== message) {
        throw new Error('Valkey health check response message did not match request');
      }
    } catch (err: unknown) {
      logger.error(err);
      status.valkey = false;
    }
  }

  ctx.body = status;
  if (!Object.values(status).every(Boolean)) {
    throwKoaError(ctx, 503, 'API unhealthy', status);
  }
}
