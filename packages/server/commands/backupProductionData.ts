import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createGzip } from 'node:zlib';

import { initS3Client, logger, uploadS3File } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt } from '../utils/crypto.js';
import { buildPostgresUri } from '../utils/database.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'backup-production-data';
export const description = 'Backs up data from the main database and app databases.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

async function backupDatabaseToS3(
  connectionString: string,
  bucket: string,
  key: string,
): Promise<void> {
  logger.info(`Backing up ${bucket}/${key}`);

  const dump = spawn('pg_dump', [`--dbname=${connectionString}`], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const gzip = createGzip();
  const stream = dump.stdout.pipe(gzip);

  let stderr = '';
  dump.stderr.on('data', (chunk) => {
    const text = String(chunk);
    stderr += text;
  });

  const dumpExited = once(dump, 'close').then(([code]) => {
    if (code !== 0) {
      const message = stderr.trim() || '(no stderr output)';
      throw new Error(`pg_dump exited with code ${code}: ${message}`);
    }
  });

  await Promise.all([uploadS3File(bucket, key, stream), dumpExited]);
  logger.info(`Backup uploaded: ${key}`);
}

export async function handler(): Promise<void> {
  let db;

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

  try {
    initS3Client({
      endPoint: argv.backupsHost,
      port: argv.backupsPort,
      useSSL: argv.backupsSecure,
      accessKey: argv.backupsAccessKey,
      secretKey: argv.backupsSecretKey,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
  }

  const timestamp = new Date().toISOString().replaceAll(/[.:TZ-]/g, '');

  let failed = false;

  // Backup main database
  try {
    logger.info('Backing up main database...');
    const key = `main/${argv.backupsFilename}_${timestamp}.sql.gz`;
    const mainDbUrl = buildPostgresUri({
      dbUser: argv.databaseUser,
      dbPassword: argv.databasePassword,
      dbHost: argv.databaseHost,
      dbPort: argv.databasePort,
      dbName: argv.databaseName,
      ssl: argv.databaseSsl,
    });
    await backupDatabaseToS3(mainDbUrl, argv.backupsBucket, key);
  } catch (err) {
    failed = true;
    logger.error('Failed to back up main database:', err);
  }

  // TODO add logic based on organization subscriptions to skip some apps

  // Backup app databases
  const apps = await App.findAll({
    attributes: ['id', 'dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbPort'],
  });

  for (const app of apps) {
    try {
      const appDbUrl = buildPostgresUri({
        dbHost: app.dbHost,
        dbName: app.dbName ?? `app-${app.id}`,
        dbPassword: decrypt(app.dbPassword, argv.aesSecret),
        dbPort: app.dbPort,
        dbUser: app.dbUser,
        ssl: argv.databaseSsl,
      });

      const key = `apps/${app.id}/${argv.backupsFilename}_${timestamp}.sql.gz`;
      await backupDatabaseToS3(appDbUrl, argv.backupsBucket, key);
    } catch (err) {
      failed = true;
      logger.error(`Failed to back up app ${app.id} database:`, err);
    }
  }

  await db.close();
  process.exit(failed ? 1 : 0);
}
