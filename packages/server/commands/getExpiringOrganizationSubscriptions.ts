import { logger } from '@appsemble/node-utils';
import dayjs from 'dayjs';
import { type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { initDB } from '../models/index.js';
import { OrganizationSubscription } from '../models/OrganizationSubscription.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  expiresWithin?: number;
}

export const command = 'get-expiring-organization-subscriptons [expires-within]';
export const description =
  'Get ogranization subscriptions that expire on a date x days in the future.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function getExpiringOrganizationSubscriptions(
  expiresWithin: number,
): Promise<OrganizationSubscription[]> {
  // 1 AM is required here because the docker container shifts the query back by one hour
  const expirationDate = dayjs().add(expiresWithin, 'day');

  const subscriptions = await OrganizationSubscription.findAll({
    where: {
      expirationDate: String(expirationDate),
      cancelled: false,
    },
  });

  return subscriptions;
}

export async function handler({ expiresWithin = 1 }: AdditionalArguments = {}): Promise<
  OrganizationSubscription[]
> {
  let db: Sequelize;
  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  const subscriptions = await getExpiringOrganizationSubscriptions(expiresWithin);

  logger.info(`Fetched ${subscriptions.length} subscriptions.`);

  await db.close();

  return subscriptions;
}
