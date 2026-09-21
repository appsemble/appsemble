import { once } from 'node:events';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, request, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import {
  deleteS3Files,
  getS3FileBuffer,
  initS3Client,
  listS3Files,
  logger,
  uploadS3File,
} from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';

import { backoff, handler } from './backupProductionData.js';
import { App, Organization } from '../models/index.js';
import { setArgv } from '../utils/argv.js';

vi.mock('../models/index.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../models/index.js')>()),
  // The test database is connected by the vitest setup and initDB() refuses to run twice.
  initDB: () => ({ close: () => Promise.resolve() }) as unknown as Sequelize,
}));

const s3Host = process.env.S3_HOST || 'localhost';
const s3Port = Number(process.env.S3_PORT) || 9009;
// A literal address, so the client and the listener cannot disagree on what localhost resolves to.
const proxyHost = '127.0.0.1';
const bucket = 'backups';

let binDir: string;
let pidFile: string;
let proxy: Server;
let proxyPort: number;
let failingPrefix: string | undefined;
let waited: number[];
let exitCode: number | string | null | undefined;

/**
 * Put a fake `pg_dump` in front of the real one on `PATH`.
 *
 * The script receives the connection URI as its only argument, has the database name in
 * `$database` and records its process id, so a test can count the dumps that ran.
 *
 * @param body The shell commands to run for a dump.
 */
async function fakePgDump(body: string): Promise<void> {
  await writeFile(
    join(binDir, 'pg_dump'),
    `#!/bin/sh\ndatabase=\${1##*/}\necho $$ >> '${pidFile}'\n${body}\n`,
    { mode: 0o755 },
  );
}

/**
 * Point the module-level S3 client at the object store, bypassing the proxy.
 *
 * @param singleBucket The single bucket to configure, or `undefined` for the bucket-per-app layout.
 */
function connectDirectly(singleBucket?: string): void {
  initS3Client({
    accessKey: 'admin',
    secretKey: 'password',
    endPoint: s3Host,
    port: s3Port,
    useSSL: false,
    bucket: singleBucket,
  });
}

/**
 * @param prefix The key prefix to list.
 * @returns The gunzipped content of every backup object under the prefix.
 */
async function dumpsUnder(prefix: string): Promise<string[]> {
  connectDirectly();
  const files = await listS3Files(bucket, prefix);
  return Promise.all(
    files.map(async ({ key }) => String(gunzipSync(await getS3FileBuffer(bucket, key)))),
  );
}

async function fakePgDumpPids(): Promise<number[]> {
  const content = await readFile(pidFile, 'utf8').catch(() => '');
  return content.split('\n').filter(Boolean).map(Number);
}

/**
 * @returns The names of the dump directories the command left in the temporary directory.
 */
async function leftoverDumpDirectories(): Promise<string[]> {
  return (await readdir(binDir)).filter((name) => name.startsWith('backup-production-data-'));
}

/**
 * @param errors A spy on `logger.error`.
 * @returns The summary lines of failed backups that were logged.
 */
function summaryLines(errors: MockInstance): string[] {
  return (errors.mock.calls as unknown[][])
    .map(([message]) => message)
    .filter(
      (message): message is string =>
        typeof message === 'string' && message.startsWith('Backup failed for'),
    );
}

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

describe('backupProductionData', () => {
  beforeAll(async () => {
    // The proxy stands in for the network between the command and the object store, so an upload
    // can fail the way a flaky connection does while the store itself stays real.
    proxy = createServer((req, res) => {
      if (failingPrefix && req.url!.startsWith(`/${bucket}${failingPrefix}`)) {
        req.socket.destroy();
        return;
      }
      const headers = { ...req.headers };
      delete headers.expect;
      const upstream = request(
        { host: s3Host, port: s3Port, method: req.method, path: req.url, headers },
        (upstreamResponse) => {
          res.writeHead(upstreamResponse.statusCode!, upstreamResponse.headers);
          upstreamResponse.pipe(res);
        },
      );
      upstream.on('error', () => res.destroy());
      req.pipe(upstream);
    });
    proxy.listen(0, proxyHost);
    await once(proxy, 'listening');
    proxyPort = (proxy.address() as AddressInfo).port;
  });

  beforeEach(async () => {
    binDir = await mkdtemp(join(tmpdir(), 'backup-production-data-test-'));
    pidFile = join(binDir, 'pids');
    vi.stubEnv('PATH', `${binDir}:${process.env.PATH}`);
    // The command dumps into the temporary directory, so leftovers show up next to the fake.
    vi.stubEnv('TMPDIR', binDir);
    failingPrefix = undefined;
    waited = [];
    vi.spyOn(backoff, 'wait').mockImplementation((milliseconds) => {
      waited.push(milliseconds);
      return Promise.resolve();
    });
    exitCode = undefined;
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      exitCode = code;
      return undefined as never;
    });

    // A single-bucket S3 client expects its bucket to exist.
    connectDirectly();
    await uploadS3File(bucket, 'placeholder', 'x');
    await deleteS3Files(
      bucket,
      (await listS3Files(bucket)).map(({ key }) => key),
    );

    setArgv({
      aesSecret: 'aes-secret',
      backupsAccessKey: 'admin',
      backupsBucket: bucket,
      backupsFilename: 'appsemble_backup',
      backupsHost: proxyHost,
      backupsPort: proxyPort,
      backupsSecretKey: 'password',
      backupsSecure: false,
      databaseHost: process.env.DATABASE_HOST || 'localhost',
      databaseName: 'appsemble',
      databasePassword: 'password',
      databasePort: Number(process.env.DATABASE_PORT) || 54_321,
      databaseSsl: false,
      databaseUser: 'admin',
    });
    await Organization.create({ id: 'test-org', name: 'Test Org' });
    for (const id of [1, 2]) {
      await App.create({
        id,
        OrganizationId: 'test-org',
        path: `app-${id}`,
        definition: { name: `App ${id}` },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
      });
    }
  });

  afterEach(async () => {
    failingPrefix = undefined;
    vi.unstubAllEnvs();
    // The command and `connectDirectly` replace the module-level client; put back the layout the
    // vitest setup configured, so its `clearAllS3Buckets` acts on that layout.
    connectDirectly(process.env.S3_BUCKET);
    for (const pid of await fakePgDumpPids()) {
      if (isRunning(pid)) {
        process.kill(pid, 'SIGKILL');
      }
    }
    await rm(binDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    proxy.closeAllConnections();
    proxy.close();
    await once(proxy, 'close');
  });

  it('should retry a failed upload without dumping again and back up every database', async () => {
    await fakePgDump('echo "-- dump of $database"');
    failingPrefix = '/sql/apps/2/';
    vi.mocked(backoff.wait).mockImplementation((milliseconds) => {
      waited.push(milliseconds);
      failingPrefix = undefined;
      return Promise.resolve();
    });

    await handler();

    expect(exitCode).toBe(0);
    expect(await dumpsUnder('sql/main/')).toStrictEqual(['-- dump of appsemble\n']);
    expect(await dumpsUnder('sql/apps/1/')).toStrictEqual(['-- dump of app-1\n']);
    expect(await dumpsUnder('sql/apps/2/')).toStrictEqual(['-- dump of app-2\n']);
    expect(waited).toStrictEqual([5000]);
    expect(await fakePgDumpPids()).toHaveLength(3);
    expect(await leftoverDumpDirectories()).toStrictEqual([]);
  });

  it('should hold one dump in scratch space at a time', async () => {
    // Each fake records how many dumps the scratch directory holds when it starts: at most its
    // own, once the previous database's dump has been uploaded and removed.
    const countsFile = join(binDir, 'counts');
    await fakePgDump(`
      ls "$TMPDIR"/backup-production-data-*/ | wc -l >> '${countsFile}'
      echo "-- dump of $database"`);

    await handler();

    expect(exitCode).toBe(0);
    const counts = (await readFile(countsFile, 'utf8')).split('\n').filter(Boolean).map(Number);
    expect(counts).toHaveLength(3);
    expect(Math.max(...counts)).toBeLessThanOrEqual(1);
  });

  it('should leave no object for a database pg_dump cannot dump', async () => {
    await fakePgDump(`
      if [ "$database" = app-2 ]; then
        echo 'pg_dump: error: connection to server failed: FATAL:  database "app-2" does not exist' >&2
        exit 1
      fi
      echo "-- dump of $database"`);
    const errors = vi.spyOn(logger, 'error');

    await handler();

    expect(exitCode).toBe(1);
    expect(await dumpsUnder('sql/main/')).toStrictEqual(['-- dump of appsemble\n']);
    expect(await dumpsUnder('sql/apps/1/')).toStrictEqual(['-- dump of app-1\n']);
    expect(await dumpsUnder('sql/apps/2/')).toStrictEqual([]);
    expect(waited).toStrictEqual([5000, 30_000, 120_000]);
    expect(summaryLines(errors)).toStrictEqual([
      'Backup failed for 1 of 3 databases: app 2 (pg_dump exited with code 1: pg_dump: error: connection to server failed: FATAL: database "app-2" does not exist)',
    ]);
    expect(await leftoverDumpDirectories()).toStrictEqual([]);
  });

  it('should leave no object when pg_dump fails after writing its output', async () => {
    await fakePgDump(`
      echo "-- dump of $database"
      if [ "$database" = appsemble ]; then
        exec >&-
        sleep 0.2
        exit 1
      fi`);
    const errors = vi.spyOn(logger, 'error');

    await handler();

    expect(exitCode).toBe(1);
    expect(await dumpsUnder('sql/main/')).toStrictEqual([]);
    expect(await dumpsUnder('sql/apps/1/')).toStrictEqual(['-- dump of app-1\n']);
    expect(await dumpsUnder('sql/apps/2/')).toStrictEqual(['-- dump of app-2\n']);
    expect(waited).toStrictEqual([5000, 30_000, 120_000]);
    expect(summaryLines(errors)).toStrictEqual([
      'Backup failed for 1 of 3 databases: main (pg_dump exited with code 1: (no stderr output))',
    ]);
  });

  it('should leave no object when pg_dump cannot be spawned', async () => {
    vi.stubEnv('PATH', binDir);
    const errors = vi.spyOn(logger, 'error');

    await handler();

    expect(exitCode).toBe(1);
    expect(await dumpsUnder('sql/')).toStrictEqual([]);
    expect(waited).toStrictEqual([
      5000, 30_000, 120_000, 5000, 30_000, 120_000, 5000, 30_000, 120_000,
    ]);
    expect(summaryLines(errors)).toStrictEqual([
      'Backup failed for 3 of 3 databases: main (spawn pg_dump ENOENT); app 1 (spawn pg_dump ENOENT); app 2 (spawn pg_dump ENOENT)',
    ]);
  });

  it('should give up on a database whose upload keeps failing without dumping it again', async () => {
    await fakePgDump('echo "-- dump of $database"');
    failingPrefix = '/sql/apps/2/';
    const errors = vi.spyOn(logger, 'error');

    await handler();

    expect(exitCode).toBe(1);
    expect(await dumpsUnder('sql/apps/1/')).toStrictEqual(['-- dump of app-1\n']);
    expect(await dumpsUnder('sql/apps/2/')).toStrictEqual([]);
    expect(waited).toStrictEqual([5000, 30_000, 120_000]);
    expect(await fakePgDumpPids()).toHaveLength(3);
    expect(summaryLines(errors)).toStrictEqual([
      expect.stringMatching(/^Backup failed for 1 of 3 databases: app 2 \(.+\)$/),
    ]);
  });
});
