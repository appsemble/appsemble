import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';

/**
 * Add DNS entries for all apps in the database in chunks
 *
 * @param db The database instance to use.
 * @param dnsConfig The DNS configuration instance to use.
 * @param chunkSize How many apps to register per DNS add request.
 */
export default async function bulkDNSRestore(db, dnsConfig, chunkSize) {
  let apps;
  let appCount = 0;
  for (let i = 0; !apps || apps.length === chunkSize; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    apps = await db.models.App.findAll({
      attributes: ['domain'],
      where: { domain: { [Op.not]: null } },
      order: ['domain'],
      limit: chunkSize,
      offset: chunkSize * i,
    });
    if (apps.length === 0) {
      break;
    }
    appCount += apps.length;
    // eslint-disable-next-line no-await-in-loop
    await dnsConfig.add(...apps.map(app => app.domain));
  }
  logger.info(`Configured DNS for ${appCount} apps`);
}
