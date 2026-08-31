import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import {
  getS3File,
  initS3Client,
  listS3Files,
  logger,
  type S3FileReference,
} from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { encrypt } from '../utils/crypto.js';
import { buildPostgresUri, getDirectPostgresConnection } from '../utils/database.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'restore-data-from-backup';
export const description =
  'Restore appsemble data from a specified backup for the main database and app databases';

const localDevelopmentAesSecret = 'Local Appsemble development AES secret';
const restoreBackupListAttempts = 3;

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
  backupsFilename: string | undefined;
  backupsHost: string;
  backupsPort: number | undefined;
  backupsSecretKey: string;
  backupsSecure: boolean;
  databaseHost: string;
  databaseDirectHost: string;
  databaseDirectPort: number;
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
      'The appsemble backup file to restore data from, e.g., appsemble_prod_backup_20250101.sql.gz, or latest',
    demandOption: true,
  });
}

function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

function isConnectionTimeout(error: unknown): boolean {
  return (
    typeof error === 'object' && error != null && 'code' in error && error.code === 'ETIMEDOUT'
  );
}

async function listRestoreBackups(bucket: string, prefix: string): Promise<S3FileReference[]> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await listS3Files(bucket, prefix);
    } catch (error) {
      if (attempt >= restoreBackupListAttempts || !isConnectionTimeout(error)) {
        throw error;
      }

      logger.warn(
        `S3 connection timed out while resolving the latest backup. Retrying ${attempt}/${restoreBackupListAttempts}`,
      );
      await sleep(attempt * 1000);
    }
  }
}

async function resolveRestoreBackupFilename({
  backupsBucket,
  backupsFilename,
  restoreBackupFilename,
}: Pick<
  RestoreDataFromBackupOptions,
  'backupsBucket' | 'backupsFilename' | 'restoreBackupFilename'
>): Promise<string> {
  if (restoreBackupFilename !== 'latest') {
    return restoreBackupFilename;
  }

  if (!backupsFilename) {
    throw new Error('The backups filename prefix must be configured to restore the latest backup');
  }

  const prefix = `sql/main/${backupsFilename}_`;
  const backups = (await listRestoreBackups(backupsBucket, prefix)).flatMap((backup) =>
    backup.key && backup.lastModified && backup.key.endsWith('.sql.gz')
      ? [{ key: backup.key, lastModified: backup.lastModified }]
      : [],
  );
  const [latest] = backups.sort((a, b) => {
    const dateDifference = b.lastModified.getTime() - a.lastModified.getTime();
    return dateDifference || b.key.localeCompare(a.key);
  });

  if (!latest?.key) {
    throw new Error(`No backups found in ${backupsBucket}/${prefix}`);
  }

  const filename = latest.key.slice('sql/main/'.length);
  logger.info(`Resolved latest backup to ${filename}`);
  return filename;
}

async function recreateDatabase(dbName: string, adminUri: string): Promise<void> {
  logger.info(`Dropping and recreating database: ${dbName}`);

  // The Appsemble deployment keeps sessions open on the database, which makes PostgreSQL refuse to
  // drop it.
  const terminateProc = spawn(
    'psql',
    [
      `--dbname=${adminUri}`,
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();`,
    ],
    {
      stdio: ['inherit', 'inherit', 'inherit'],
    },
  );

  const [terminateCode] = await once(terminateProc, 'close');
  if (terminateCode !== 0) {
    throw new Error(
      `Failed to terminate connections to database ${dbName} (exit code ${terminateCode})`,
    );
  }

  const dropProc = spawn(
    'psql',
    [
      `--dbname=${adminUri}`,
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `DROP DATABASE IF EXISTS "${dbName}";`,
    ],
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
    [`--dbname=${adminUri}`, '-X', '-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${dbName}";`],
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
  const restore = spawn('psql', [`--dbname=${connectionString}`, '-X', '-v', 'ON_ERROR_STOP=1'], {
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
  backupsFilename,
  backupsHost,
  backupsPort,
  backupsSecretKey,
  backupsSecure,
  databaseHost,
  databaseDirectHost,
  databaseDirectPort,
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
    dbHost: databaseDirectHost,
    dbPort: databaseDirectPort,
    dbName: 'postgres',
    ssl: databaseSsl,
  });

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

  const resolvedRestoreBackupFilename = await resolveRestoreBackupFilename({
    backupsBucket,
    backupsFilename,
    restoreBackupFilename,
  });
  await recreateDatabase(databaseName, adminUri);

  try {
    db = initDB({
      host: databaseDirectHost,
      port: databaseDirectPort,
      username: databaseUser,
      password: databasePassword,
      database: databaseName,
      ssl: databaseSsl,
      uri:
        databaseDirectHost === databaseHost && databaseDirectPort === databasePort
          ? databaseUrl
          : undefined,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  let failed = false;

  // Restore main database
  try {
    logger.info('Restoring main database...');
    const key = `sql/main/${resolvedRestoreBackupFilename}`;
    const mainDbUrl = buildPostgresUri({
      dbUser: databaseUser,
      dbPassword: databasePassword,
      dbHost: databaseDirectHost,
      dbPort: databaseDirectPort,
      dbName: databaseName,
      ssl: databaseSsl,
    });
    await restoreDatabaseFromS3(mainDbUrl, backupsBucket, key);
  } catch (err) {
    failed = true;
    logger.error('Failed to restore main database:', err);
  }

  if (failed) {
    await db.close();
    return true;
  }

  // Restore app databases
  const apps = await App.findAll({
    attributes: ['id', 'dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbPort'],
  });
  const dbPassword = databasePassword;

  for (const app of apps) {
    // Point the app at the new database. This is not a restore: until it lands the app row still
    // holds the source database credentials, so a failure here must abort rather than be tolerated.
    await app.update({
      dbHost: databaseHost,
      dbPort: databasePort,
      dbUser: databaseUser,
      dbPassword: encrypt(dbPassword, effectiveAesSecret),
    });

    try {
      const dbName = app.dbName ?? `app-${app.id}`;

      const appDbUrl = buildPostgresUri({
        dbHost: databaseDirectHost,
        dbName,
        dbPassword,
        dbPort: databaseDirectPort,
        dbUser: databaseUser,
        ssl: databaseSsl,
      });

      const key = `sql/apps/${app.id}/${resolvedRestoreBackupFilename}`;
      await recreateDatabase(dbName, adminUri);
      await restoreDatabaseFromS3(appDbUrl, backupsBucket, key);
    } catch (err) {
      logger.error(`Failed to restore app ${app.id} database:`);
      logger.error(err);
    }
  }

  await db.close();

  return failed;
}

export async function handler(): Promise<void> {
  const directDatabase = getDirectPostgresConnection({
    dbHost: argv.databaseHost,
    dbPort: argv.databasePort,
  });
  const failed = await restoreDataFromBackup({
    aesSecret: argv.aesSecret,
    backupsAccessKey: argv.backupsAccessKey,
    backupsBucket: argv.backupsBucket,
    backupsFilename: argv.backupsFilename,
    backupsHost: argv.backupsHost,
    backupsPort: argv.backupsPort,
    backupsSecretKey: argv.backupsSecretKey,
    backupsSecure: argv.backupsSecure,
    databaseHost: argv.databaseHost,
    databaseDirectHost: directDatabase.dbHost,
    databaseDirectPort: directDatabase.dbPort,
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
