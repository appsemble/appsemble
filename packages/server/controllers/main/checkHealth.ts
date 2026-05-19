import { logger, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getDB } from '../../models/index.js';
import { argv } from '../../utils/argv.js';
import { pingValkey } from '../../utils/valkey.js';

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
      await pingValkey();
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
