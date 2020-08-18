import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { App } from '../models';
import type { DNSImplementation } from './dns';

/**
 * Add DNS entries for all apps in the database in chunks
 *
 * @param hostname - The hostname of the Appsemble server.
 * @param dnsConfig - The DNS configuration instance to use.
 * @param chunkSize - How many apps to register per DNS add request.
 */
export async function bulkDNSRestore(
  hostname: string,
  dnsConfig: DNSImplementation,
  chunkSize: number,
): Promise<void> {
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
