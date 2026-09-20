import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import { createGzip } from 'node:zlib';

import { deleteS3File, initS3Client, logger, uploadS3File } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { backupsBuilder } from './builder/backups.js';
import { databaseBuilder } from './builder/database.js';
import { App, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt } from '../utils/crypto.js';
import { buildPostgresUri, getDirectPostgresConnection } from '../utils/database.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'backup-production-data';
export const description = 'Backs up data from the main database and app databases.';

/**
 * The backoff between attempts to dump one database.
 *
 * `delays` holds the wait in milliseconds before each retry, so a database is dumped at most
 * `delays.length + 1` times. Tests replace `wait` to run the retries without waiting.
 */
export const backoff = {
  delays: [5000, 30_000, 120_000],
  wait: (milliseconds: number): Promise<void> => sleep(milliseconds),
};

export function builder(yargs: Argv): Argv {
  return backupsBuilder(databaseBuilder(yargs));
}

/**
 * Stream one `pg_dump` through gzip into an S3 object.
 *
 * Each end of the pipeline is torn down when the other end fails, and the object is removed when
 * a failed dump was committed anyway. The `Upload` of `@aws-sdk/lib-storage` keeps its in-flight
 * requests going after `abort()`, so a failed dump closes the upload source instead: the upload
 * then settles before the object is deleted, and a multipart upload is aborted rather than
 * completed.
 *
 * @param connectionString The Postgres URI of the database to dump.
 * @param bucket The bucket to store the dump in.
 * @param key The key of the dump object.
 */
async function dumpDatabaseToS3(
  connectionString: string,
  bucket: string,
  key: string,
): Promise<void> {
  const dump = spawn('pg_dump', [`--dbname=${connectionString}`], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const gzip = createGzip();

  let stderr = '';
  dump.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  let failure: unknown;
  const uploaded = uploadS3File(bucket, key, dump.stdout.pipe(gzip)).then(
    () => true,
    (error: unknown) => {
      failure ??= error;
      // Without this pg_dump sits blocked on its pipe, holding a COPY on the database.
      dump.kill('SIGKILL');
      gzip.destroy();
      return false;
    },
  );
  const exited = once(dump, 'close').then(
    ([code, signal]) => {
      if (code === 0) {
        return;
      }
      if (failure == null) {
        const reason = signal ? `signal ${signal}` : `code ${code}`;
        failure = new Error(
          `pg_dump exited with ${reason}: ${stderr.trim() || '(no stderr output)'}`,
        );
      }
      gzip.destroy();
    },
    (error: unknown) => {
      // The process could not be spawned; closing the upload source lets the upload settle.
      failure ??= error;
      gzip.destroy();
    },
  );
  const [committed] = await Promise.all([uploaded, exited]);

  if (failure == null) {
    return;
  }
  if (committed) {
    // The dump finished uploading before pg_dump reported its failure.
    await deleteS3File(bucket, key);
  }
  throw failure;
}

async function backupDatabaseToS3(
  connectionString: string,
  bucket: string,
  key: string,
): Promise<void> {
  logger.info(`Backing up ${bucket}/${key}`);

  for (let attempt = 0; ; attempt += 1) {
    try {
      await dumpDatabaseToS3(connectionString, bucket, key);
      logger.info(`Backup uploaded: ${key}`);
      return;
    } catch (error) {
      if (attempt >= backoff.delays.length) {
        throw error;
      }
      const delay = backoff.delays[attempt];
      logger.warn(`Backup of ${key} failed, retrying in ${delay / 1000} s:`, error);
      await backoff.wait(delay);
    }
  }
}

function describeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replaceAll(/\s+/g, ' ');
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
      // Parsed value from the kubernetes env is a string
      useSSL:
        typeof argv.backupsSecure === 'string' ? argv.backupsSecure === 'true' : argv.backupsSecure,
      accessKey: argv.backupsAccessKey,
      secretKey: argv.backupsSecretKey,
      region: argv.backupsRegion,
      pathStyle: argv.backupsPathStyle,
      bucket: argv.backupsBucket,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
  }

  const timestamp = new Date().toISOString().replaceAll(/[.:TZ-]/g, '');
  const directDatabase = getDirectPostgresConnection({
    dbHost: argv.databaseHost,
    dbPort: argv.databasePort,
  });

  const failures = new Map<string, unknown>();

  // Backup main database
  try {
    logger.info('Backing up main database...');
    const key = `sql/main/${argv.backupsFilename}_${timestamp}.sql.gz`;
    const mainDbUrl = buildPostgresUri({
      ...directDatabase,
      dbUser: argv.databaseUser,
      dbPassword: argv.databasePassword,
      dbName: argv.databaseName,
      ssl: argv.databaseSsl,
    });
    await backupDatabaseToS3(mainDbUrl, argv.backupsBucket, key);
  } catch (err) {
    failures.set('main', err);
    logger.error('Failed to back up main database:', err);
  }

  // TODO add logic based on organization subscriptions to skip some apps

  // Backup app databases
  const apps = await App.findAll({
    attributes: ['id', 'dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbPort'],
  });

  for (const app of apps) {
    try {
      const appDatabase =
        app.dbHost === argv.databaseHost && app.dbPort === argv.databasePort
          ? getDirectPostgresConnection({ dbHost: app.dbHost, dbPort: app.dbPort })
          : { dbHost: app.dbHost, dbPort: app.dbPort };
      const appDbUrl = buildPostgresUri({
        ...appDatabase,
        dbName: app.dbName ?? `app-${app.id}`,
        dbPassword: decrypt(app.dbPassword, argv.aesSecret),
        dbUser: app.dbUser,
        ssl: argv.databaseSsl,
      });

      const key = `sql/apps/${app.id}/${argv.backupsFilename}_${timestamp}.sql.gz`;
      await backupDatabaseToS3(appDbUrl, argv.backupsBucket, key);
    } catch (err) {
      failures.set(`app ${app.id}`, err);
      logger.error(`Failed to back up app ${app.id} database:`, err);
    }
  }

  await db.close();
  if (failures.size) {
    // A single line, so one grep of the log tells which databases lack a backup and why.
    logger.error(
      `Backup failed for ${failures.size} of ${apps.length + 1} databases: ${[...failures]
        .map(([database, error]) => `${database} (${describeError(error)})`)
        .join('; ')}`,
    );
  }
  process.exit(failures.size ? 1 : 0);
}
