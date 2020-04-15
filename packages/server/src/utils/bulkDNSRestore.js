import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { App } from '../models';

/**
 * Add DNS entries for all apps in the database in chunks
 *
 * @param db The database instance to use.
 * @param dnsConfig The DNS configuration instance to use.
 * @param chunkSize How many apps to register per DNS add request.
 */
export default async function bulkDNSRestore(hostname, db, dnsConfig, chunkSize) {
  let apps;
  let appCount = 0;
  for (let i = 0; !apps || apps.length === chunkSize; i += 1) {
    apps = await App.findAll({
      attributes: ['domain', 'path', 'OrganizationId'],
      where: { domain: { [Op.not]: null } },
      order: ['OrganizationId', 'path'],
      limit: chunkSize,
      offset: chunkSize * i,
    });
    if (apps.length === 0) {
      break;
    }
    appCount += apps.length;
    await dnsConfig.add(
      ...apps
        .flatMap((app) => [app.domain, `${app.path}.${app.OrganizationId}.${hostname}`])
        .filter(Boolean),
    );
  }
  logger.info(`Configured DNS for ${appCount} apps`);
}
