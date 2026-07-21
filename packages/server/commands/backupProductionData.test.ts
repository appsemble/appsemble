import { PassThrough, Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { spawn } from 'node:child_process';

import { uploadS3File } from '@appsemble/node-utils';

import { App, initDB } from '../models/index.js';
import { type App as MainApp } from '../models/main/App.js';
import { setArgv } from '../utils/argv.js';
import { handler } from './backupProductionData.js';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('@appsemble/node-utils', () => ({
  initS3Client: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  uploadS3File: vi.fn(() => Promise.resolve()),
}));

vi.mock('../models/index.js', () => ({
  App: {
    findAll: vi.fn(),
  },
  initDB: vi.fn(),
}));

vi.mock('../utils/crypto.js', () => ({
  decrypt: vi.fn((value: Buffer) => `decrypted-${String(value)}`),
}));

type SpawnReturn = ReturnType<typeof spawn>;
type InitDbReturn = ReturnType<typeof initDB>;

function createChildProcessMock(code: number): PassThrough & {
  stderr: PassThrough;
  stdout: Readable;
} {
  const processMock = Object.assign(new PassThrough(), {
    stderr: new PassThrough(),
    stdout: Readable.from(['sql']),
  });

  queueMicrotask(() => {
    processMock.emit('close', code);
  });

  return processMock;
}

function createApp(values: Partial<MainApp> & Pick<MainApp, 'id'>): MainApp {
  return values as MainApp;
}

describe('backupProductionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DATABASE_DIRECT_HOST', 'postgres.example.com');
    vi.stubEnv('DATABASE_DIRECT_PORT', '5432');
    vi.spyOn(process, 'exit').mockImplementation(() => null as never);
    setArgv({
      aesSecret: 'aes-secret',
      backupsAccessKey: 'backup-access-key',
      backupsBucket: 'backup-bucket',
      backupsFilename: 'appsemble_backup',
      backupsHost: 's3.example.com',
      backupsPort: 443,
      backupsSecretKey: 'backup-secret-key',
      backupsSecure: true,
      databaseHost: 'pooler.example.com',
      databaseName: 'appsemble',
      databasePassword: 'database-password',
      databasePort: 6432,
      databaseSsl: false,
      databaseUser: 'database-user',
    });
    vi.mocked(initDB).mockReturnValue({
      close: vi.fn(() => Promise.resolve()),
    } as unknown as InitDbReturn);
    vi.mocked(App.findAll).mockResolvedValue([
      createApp({
        dbHost: 'pooler.example.com',
        dbName: 'app-1',
        dbPassword: Buffer.from('managed-password'),
        dbPort: 6432,
        dbUser: 'database-user',
        id: 1,
      }),
      createApp({
        dbHost: 'external.example.com',
        dbName: 'external-db',
        dbPassword: Buffer.from('external-password'),
        dbPort: 6543,
        dbUser: 'external-user',
        id: 2,
      }),
    ]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should back up managed databases directly and preserve external database endpoints', async () => {
    const expectedConnections = new Map([
      [
        'appsemble',
        {
          host: 'postgres.example.com',
          password: 'database-password',
          port: 5432,
          username: 'database-user',
        },
      ],
      [
        'app-1',
        {
          host: 'postgres.example.com',
          password: 'decrypted-managed-password',
          port: 5432,
          username: 'database-user',
        },
      ],
      [
        'external-db',
        {
          host: 'external.example.com',
          password: 'decrypted-external-password',
          port: 6543,
          username: 'external-user',
        },
      ],
    ]);
    vi.mocked(spawn).mockImplementation((command, args) => {
      const databaseArgument = args?.find((arg) => String(arg).startsWith('--dbname='));
      const databaseUrl = new URL(String(databaseArgument).slice('--dbname='.length));
      const expected = expectedConnections.get(databaseUrl.pathname.slice(1));
      const matchesExpectedConnection =
        command === 'pg_dump' &&
        expected != null &&
        databaseUrl.hostname === expected.host &&
        databaseUrl.password === expected.password &&
        Number(databaseUrl.port) === expected.port &&
        databaseUrl.username === expected.username;
      return createChildProcessMock(matchesExpectedConnection ? 0 : 1) as unknown as SpawnReturn;
    });

    await handler();

    expect(process.exit).toHaveBeenCalledWith(0);
    expect(uploadS3File).toHaveBeenCalledTimes(3);
    expect(vi.mocked(uploadS3File).mock.calls.map(([, key]) => key)).toStrictEqual(
      expect.arrayContaining([
        expect.stringMatching(/^sql\/main\/appsemble_backup_\d{17}\.sql\.gz$/),
        expect.stringMatching(/^sql\/apps\/1\/appsemble_backup_\d{17}\.sql\.gz$/),
        expect.stringMatching(/^sql\/apps\/2\/appsemble_backup_\d{17}\.sql\.gz$/),
      ]),
    );
  });
});
