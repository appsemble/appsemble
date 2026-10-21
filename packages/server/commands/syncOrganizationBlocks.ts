import { initS3Client, logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { syncOrganizationBlocks } from '../utils/block.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  organizations?: string[];
}

export const command = 'sync-organization-blocks';
export const description =
  'Synchronize the latest block versions of organizations from the remote Appsemble server.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('remote', {
      desc: 'The remote Appsemble server to synchronize blocks from. For example: https://appsemble.app',
      demandOption: true,
      type: 'string',
    })
    .option('organizations', {
      desc: 'The IDs of the organizations whose blocks to synchronize.',
      demandOption: true,
      type: 'string',
      array: true,
    });
}

export async function handler({ organizations = [] }: AdditionalArguments = {}): Promise<void> {
  let db;

  try {
    db = initDB({
      database: argv.databaseName,
      host: argv.databaseHost,
      password: argv.databasePassword,
      port: argv.databasePort,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
      username: argv.databaseUser,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  initS3Client({
    accessKey: argv.s3AccessKey,
    endPoint: argv.s3Host,
    port: argv.s3Port,
    secretKey: argv.s3SecretKey,
    useSSL: argv.s3Secure,
    region: argv.s3Region,
    pathStyle: argv.s3PathStyle,
    bucket: argv.s3Bucket,
  });

  for (const organizationId of organizations) {
    logger.info(`Synchronizing blocks of organization ${organizationId} from ${argv.remote}`);
    await syncOrganizationBlocks(organizationId);
  }

  await db.close();
  process.exit();
}
