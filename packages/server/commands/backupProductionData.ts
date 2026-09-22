import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { createGzip } from 'node:zlib';

import { initS3Client, logger, uploadS3File } from '@appsemble/node-utils';
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
 * The backoff between attempts at one step, dumping or uploading a database.
 *
 * `delays` holds the wait in milliseconds before each retry, so a step runs at most
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
 * Dump one database through gzip into a file.
 *
 * @param connectionString The Postgres URI of the database to dump.
 * @param path The file to write the gzipped dump to.
 */
async function dumpDatabase(connectionString: string, path: string): Promise<void> {
  const dump = spawn('pg_dump', [`--dbname=${connectionString}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  dump.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const [[code, signal]] = await Promise.all([
    once(dump, 'close'),
    pipeline(dump.stdout, createGzip(), createWriteStream(path)),
  ]);
  if (code !== 0) {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    throw new Error(`pg_dump exited with ${reason}: ${stderr.trim() || '(no stderr output)'}`);
  }
}

async function withRetries(step: string, action: () => Promise<void>): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      if (attempt >= backoff.delays.length) {
        throw error;
      }
      const delay = backoff.delays[attempt];
      logger.warn(`${step} failed, retrying in ${delay / 1000} s:`, error);
      await backoff.wait(delay);
    }
  }
}

/**
 * Dump one database to a file, then upload the file.
 *
 * Nothing touches the object store before `pg_dump` has exited successfully, so no partial dump
 * is ever committed, `pg_dump` never waits on the network, and a retried upload costs egress only.
 *
 * @param connectionString The Postgres URI of the database to dump.
 * @param bucket The bucket to store the dump in.
 * @param key The key of the dump object.
 * @param directory The directory to hold the dump until it is uploaded.
 */
async function backupDatabaseToS3(
  connectionString: string,
  bucket: string,
  key: string,
  directory: string,
): Promise<void> {
  logger.info(`Backing up ${bucket}/${key}`);
  const path = join(directory, key.replaceAll('/', '-'));

  try {
    await withRetries(`Dump of ${key}`, () => dumpDatabase(connectionString, path));
    // A stream of unknown length goes up in parts, which the client retries one at a time.
    await withRetries(`Upload of ${key}`, () => uploadS3File(bucket, key, createReadStream(path)));
    logger.info(`Backup uploaded: ${key}`);
  } finally {
    await rm(path, { force: true });
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
      useSSL: argv.backupsSecure,
      accessKey: argv.backupsAccessKey,
      secretKey: argv.backupsSecretKey,
      region: argv.backupsRegion,
      pathStyle: argv.backupsPathStyle,
      bucket: argv.backupsBucket,
      // A part whose connection goes quiet for a minute fails and is retried, where the operating
      // system's TCP timeout takes up to half an hour.
      socketTimeout: 60_000,
    });
  } catch (error: unknown) {
    logger.warn(`S3Error: ${error}`);
    logger.warn('Features related to file uploads will not work correctly!');
  }

  const timestamp = new Date().toISOString().replaceAll(/[.:TZ-]/g, '');
  const directory = await mkdtemp(join(tmpdir(), 'backup-production-data-'));
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
    await backupDatabaseToS3(mainDbUrl, argv.backupsBucket, key, directory);
  } catch (err) {
    failures.set('main', err);
    logger.error('Failed to back up main database:', err);
  }

  // TODO add logic based on organization subscriptions to skip some apps

  // Backup app databases
  // Soft-deleted apps keep their database, which a restore must be able to bring back.
  const apps = await App.findAll({
    attributes: ['id', 'dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbPort'],
    paranoid: false,
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
      await backupDatabaseToS3(appDbUrl, argv.backupsBucket, key, directory);
    } catch (err) {
      failures.set(`app ${app.id}`, err);
      logger.error(`Failed to back up app ${app.id} database:`, err);
    }
  }

  await db.close();
  await rm(directory, { recursive: true, force: true });
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
