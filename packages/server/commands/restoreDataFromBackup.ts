import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import { getS3File, initS3Client, logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { encrypt } from '../utils/crypto.js';
import { buildPostgresUri } from '../utils/database.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'restore-data-from-backup';
export const description =
  'Restore appsemble data from a specified backup for the main database and app databases';

const localDevelopmentAesSecret = 'Local Appsemble development AES secret';

export function assertRestoreDataFromBackupAesSecret(
  aesSecret: string | null | undefined,
  nodeEnv = process.env.NODE_ENV,
): void {
  if (nodeEnv !== 'development' && (aesSecret == null || aesSecret.trim() === '')) {
    throw new Error('The --aes-secret argument is required and cannot be empty.');
  }
}

export interface RestoreDataFromBackupOptions {
  aesSecret: string | undefined;
  backupsAccessKey: string;
  backupsBucket: string;
  backupsHost: string;
  backupsPort: number | undefined;
  backupsSecretKey: string;
  backupsSecure: boolean;
  databaseHost: string;
  databaseName: string;
  databasePassword: string;
  databasePort: number;
  databaseSsl: boolean;
  databaseUrl: string;
  databaseUser: string;
  restoreBackupFilename: string;
}

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

export async function restoreDataFromBackup({
  aesSecret,
  backupsAccessKey,
  backupsBucket,
  backupsHost,
  backupsPort,
  backupsSecretKey,
  backupsSecure,
  databaseHost,
  databaseName,
  databasePassword,
  databasePort,
  databaseSsl,
  databaseUrl,
  databaseUser,
  restoreBackupFilename,
}: RestoreDataFromBackupOptions): Promise<boolean> {
  let db;

  assertRestoreDataFromBackupAesSecret(aesSecret);
  const effectiveAesSecret = aesSecret || localDevelopmentAesSecret;

  const adminUri = buildPostgresUri({
    dbUser: databaseUser,
    dbPassword: databasePassword,
    dbHost: databaseHost,
    dbPort: databasePort,
    dbName: 'postgres',
    ssl: databaseSsl,
  });
  await recreateDatabase(databaseName, adminUri);

  try {
    db = initDB({
      host: databaseHost,
      port: databasePort,
      username: databaseUser,
      password: databasePassword,
      database: databaseName,
      ssl: databaseSsl,
      uri: databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  try {
    initS3Client({
      endPoint: backupsHost,
      port: backupsPort,
      useSSL: backupsSecure,
      accessKey: backupsAccessKey,
      secretKey: backupsSecretKey,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
  }

  let failed = false;

  // Backup main database
  try {
    logger.info('Restoring main database...');
    const key = `sql/main/${restoreBackupFilename}`;
    const mainDbUrl = buildPostgresUri({
      dbUser: databaseUser,
      dbPassword: databasePassword,
      dbHost: databaseHost,
      dbPort: databasePort,
      dbName: databaseName,
      ssl: databaseSsl,
    });
    await restoreDatabaseFromS3(mainDbUrl, backupsBucket, key);
  } catch (err) {
    failed = true;
    logger.error('Failed to restore main database:', err);
  }

  // Restore app databases
  const apps = await App.findAll({
    attributes: ['id', 'dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbPort'],
  });
  const dbPassword = databasePassword;

  for (const app of apps) {
    try {
      // Migrating to a new database hence the settings from the new DB should be used.
      await app.update({
        dbHost: databaseHost,
        dbPort: databasePort,
        dbUser: databaseUser,
        dbPassword: encrypt(dbPassword, effectiveAesSecret),
      });
      const dbName = app.dbName ?? `app-${app.id}`;

      const appDbUrl = buildPostgresUri({
        dbHost: app.dbHost,
        dbName,
        dbPassword,
        dbPort: app.dbPort,
        dbUser: app.dbUser,
        ssl: databaseSsl,
      });

      const key = `sql/apps/${app.id}/${restoreBackupFilename}`;
      await recreateDatabase(dbName, adminUri);
      await restoreDatabaseFromS3(appDbUrl, backupsBucket, key);
    } catch (err) {
      failed = true;
      logger.error(`Failed to restore app ${app.id} database:`);
      logger.error(err);
    }
  }

  await db.close();

  return failed;
}

export async function handler(): Promise<void> {
  const failed = await restoreDataFromBackup({
    aesSecret: argv.aesSecret,
    backupsAccessKey: argv.backupsAccessKey,
    backupsBucket: argv.backupsBucket,
    backupsHost: argv.backupsHost,
    backupsPort: argv.backupsPort,
    backupsSecretKey: argv.backupsSecretKey,
    backupsSecure: argv.backupsSecure ?? true,
    databaseHost: argv.databaseHost,
    databaseName: argv.databaseName,
    databasePassword: argv.databasePassword,
    databasePort: argv.databasePort,
    databaseSsl: argv.databaseSsl,
    databaseUrl: argv.databaseUrl,
    databaseUser: argv.databaseUser,
    restoreBackupFilename: argv.restoreBackupFilename,
  });

  process.exit(failed ? 1 : 0);
}
