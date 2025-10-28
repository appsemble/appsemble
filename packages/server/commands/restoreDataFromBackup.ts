import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import { getS3File, initS3Client, logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt } from '../utils/crypto.js';
import { buildPostgresUri } from '../utils/database.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'restore-data-from-backup';
export const description =
  'Restore appsemble data from a specified backup for the main database and app databases';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs).option('restoreBackupFilename', {
    type: 'string',
    describe:
      'The appsemble backup file to restore data from, e.g., appsemble_prod_backup_20250101.sql.gz',
    demandOption: true,
  });
}

async function recreateDatabase(dbName: string, adminUri: string): Promise<void> {
  logger.info(`Dropping and recreating database: ${dbName}`);

  const dropProc = spawn(
    'psql',
    [`--dbname=${adminUri}`, '-v', 'ON_ERROR_STOP=1', '-c', `DROP DATABASE IF EXISTS "${dbName}";`],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
    },
  );

  const [dropCode] = await once(dropProc, 'close');
  if (dropCode !== 0) {
    throw new Error(`Failed to drop database ${dbName} (exit code ${dropCode})`);
  }

  const createProc = spawn(
    'psql',
    [`--dbname=${adminUri}`, '-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${dbName}";`],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
    },
  );

  const [createCode] = await once(createProc, 'close');
  if (createCode !== 0) {
    throw new Error(`Failed to create database ${dbName} (exit code ${createCode})`);
  }

  logger.info(`Database ${dbName} recreated successfully`);
}

async function restoreDatabaseFromS3(
  connectionString: string,
  bucket: string,
  key: string,
): Promise<void> {
  logger.info(`Restoring ${bucket}/${key} into ${connectionString}`);

  const gunzip = createGunzip();
  const restore = spawn('psql', [`--dbname=${connectionString}`], {
    stdio: ['pipe', 'inherit', 'pipe'],
  });

  let stderr = '';
  restore.stderr.on('data', (chunk) => {
    const text = String(chunk);
    stderr += text;
    if (text.includes('ERROR') || text.includes('WARNING')) {
      logger.warn(`[psql stderr] ${text.trim()}`);
    }
  });

  const restoreExited = once(restore, 'close').then(([code]) => {
    if (code !== 0) {
      const message = stderr.trim() || '(no stderr output)';
      throw new Error(`psql exited with code ${code}: ${message}`);
    }
  });

  const s3Stream = await getS3File(bucket, key);
  await pipeline(s3Stream, gunzip, restore.stdin);

  await restoreExited;
  logger.info(`Database restored from ${key}`);
}

export async function handler(): Promise<void> {
  let db;

  const adminUri = buildPostgresUri({
    dbUser: argv.databaseUser,
    dbPassword: argv.databasePassword,
    dbHost: argv.databaseHost,
    dbPort: argv.databasePort,
    dbName: 'postgres',
    ssl: argv.databaseSsl,
  });
  await recreateDatabase(argv.databaseName, adminUri);

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

  let failed = false;

  // Backup main database
  try {
    logger.info('Restoring main database...');
    const key = `main/${argv.restoreBackupFilename}`;
    const mainDbUrl = buildPostgresUri({
      dbUser: argv.databaseUser,
      dbPassword: argv.databasePassword,
      dbHost: argv.databaseHost,
      dbPort: argv.databasePort,
      dbName: argv.databaseName,
      ssl: argv.databaseSsl,
    });
    await restoreDatabaseFromS3(mainDbUrl, argv.backupsBucket, key);
  } catch (err) {
    failed = true;
    logger.error('Failed to restore main database:', err);
  }

  // Restore app databases
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

      const key = `apps/${app.id}/${argv.restoreBackupFilename}`;
      await recreateDatabase(app.dbName ?? `app-${app.id}`, adminUri);
      await restoreDatabaseFromS3(appDbUrl, argv.backupsBucket, key);
    } catch (err) {
      failed = true;
      logger.error(`Failed to restore app ${app.id} database:`, err);
    }
  }

  await db.close();
  process.exit(failed ? 1 : 0);
}
