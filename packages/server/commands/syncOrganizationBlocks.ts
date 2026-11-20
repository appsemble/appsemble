import { initS3Client } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { type OrganizationBlocksVersion, syncOrganizationBlocks } from '../utils/block.js';
import { handleDBError } from '../utils/sqlUtils.js';

interface AdditionalArguments {
  organization: OrganizationBlocksVersion[];
}

export const command = 'sync-organization-blocks';
export const description =
  'Synchronize the blocks of organizations from the remote Appsemble server.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('remote', {
      desc: 'The remote Appsemble server to synchronize blocks from. For example: https://appsemble.app',
      demandOption: true,
      type: 'string',
    })
    .option('organization', {
      desc: 'An organization and the block version to synchronize, as `<id>:<version>`. The version is `server` for the version of this server, `latest` for the latest version of each block, or an explicit version. Repeat for multiple organizations.',
      demandOption: true,
      type: 'string',
      array: true,
      coerce: (values: string[]) =>
        values.map((value) => {
          const [organization, version] = value.split(':');
          if (!organization || !version) {
            throw new Error(`Expected --organization as <id>:<version>, got ${value}`);
          }
          return { organization, version };
        }),
    });
}

export async function handler({ organization }: AdditionalArguments): Promise<void> {
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

  await syncOrganizationBlocks(organization);

  await db.close();
  process.exit();
}
