import { Readable } from 'node:stream';

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { spawn } from 'node:child_process';

import { getS3File, initS3Client, logger } from '@appsemble/node-utils';

import { App, initDB } from '../models/index.js';
import { type App as MainApp } from '../models/main/App.js';
import { encrypt } from '../utils/crypto.js';
import { buildPostgresUri } from '../utils/database.js';
import {
  restoreDataFromBackup,
  type RestoreDataFromBackupOptions,
} from './restoreDataFromBackup.js';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:stream/promises', () => ({
  pipeline: vi.fn(() => Promise.resolve()),
}));

vi.mock('node:zlib', () => ({
  createGunzip: vi.fn(() => ({})),
}));

vi.mock('@appsemble/node-utils', () => ({
  getS3File: vi.fn(() => Promise.resolve(Readable.from(['sql']))),
  initS3Client: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../models/index.js', () => ({
  App: {
    findAll: vi.fn(() => Promise.resolve([])),
  },
  initDB: vi.fn(() => ({
    close: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('../utils/crypto.js', () => ({
  encrypt: vi.fn((value: string, secret: string) => `encrypted:${value}:${secret}`),
}));

vi.mock('../utils/database.js', () => ({
  buildPostgresUri: vi.fn(({ dbName }: { dbName: string }) => `postgres://${dbName}`),
}));

vi.mock('../utils/sqlUtils.js', () => ({
  handleDBError: vi.fn((error: Error) => {
    throw error;
  }),
}));

const baseOptions: RestoreDataFromBackupOptions = {
  aesSecret: 'test-aes-secret',
  backupsAccessKey: 'backup-access-key',
  backupsBucket: 'backup-bucket',
  backupsHost: 's3.example.com',
  backupsPort: 443,
  backupsSecretKey: 'backup-secret-key',
  backupsSecure: true,
  databaseHost: 'database.example.com',
  databaseName: 'appsemble',
  databasePassword: 'database-password',
  databasePort: 5432,
  databaseSsl: true,
  databaseUrl: 'postgres://database-url',
  databaseUser: 'database-user',
  restoreBackupFilename: 'appsemble_prod_backup_20250101.sql.gz',
};

const originalNodeEnv = process.env.NODE_ENV;
type SpawnReturn = ReturnType<typeof spawn>;
type InitDbReturn = ReturnType<typeof initDB>;

type Listener = (...args: readonly unknown[]) => void;

type AppUpdateMock = ReturnType<typeof vi.fn<MainApp['update']>>;

interface MockAppInput {
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbUser: string;
  id: number;
  update: AppUpdateMock;
}

function createFoundApp(mock: MockAppInput): MainApp {
  return mock as unknown as MainApp;
}

class MockEmitter {
  private listeners = new Map<string, Listener[]>();

  addListener(eventName: string, listener: Listener): this {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
    return this;
  }

  on(eventName: string, listener: Listener): this {
    return this.addListener(eventName, listener);
  }

  off(eventName: string, listener: Listener): this {
    const listeners = this.listeners.get(eventName);
    if (!listeners) {
      return this;
    }
    this.listeners.set(
      eventName,
      listeners.filter((existingListener) => existingListener !== listener),
    );
    return this;
  }

  removeListener(eventName: string, listener: Listener): this {
    return this.off(eventName, listener);
  }

  once(eventName: string, listener: Listener): this {
    const wrappedListener: Listener = (...args) => {
      this.off(eventName, wrappedListener);
      listener(...args);
    };

    return this.on(eventName, wrappedListener);
  }

  emit(eventName: string, ...args: readonly unknown[]): boolean {
    const listeners = this.listeners.get(eventName);
    if (!listeners) {
      return false;
    }

    for (const listener of listeners.slice()) {
      listener(...args);
    }

    return true;
  }
}

function createChildProcessMock(code = 0): MockEmitter & {
  stderr: MockEmitter;
  stdin: object;
} {
  const processMock = Object.assign(new MockEmitter(), {
    stderr: new MockEmitter(),
    stdin: {},
  });

  queueMicrotask(() => {
    processMock.emit('close', code);
  });

  return processMock;
}

describe('restoreDataFromBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';

    vi.mocked(spawn).mockImplementation(() => createChildProcessMock(0) as unknown as SpawnReturn);
    vi.mocked(buildPostgresUri).mockImplementation(
      ({ dbName }: { dbName: string }) => `postgres://${dbName}`,
    );
    vi.mocked(initDB).mockReturnValue({
      close: vi.fn(() => Promise.resolve()),
    } as unknown as InitDbReturn);
    vi.mocked(App.findAll).mockResolvedValue([]);
    vi.mocked(getS3File).mockResolvedValue(Readable.from(['sql']));
    vi.mocked(initS3Client).mockReset();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should throw in non-development environments when aesSecret is missing', async () => {
    await expect(
      restoreDataFromBackup({
        ...baseOptions,
        aesSecret: undefined,
      }),
    ).rejects.toThrowError('The --aes-secret argument is required and cannot be empty.');

    expect(spawn).not.toHaveBeenCalled();
  });

  it('should use the provided aesSecret when updating app database passwords', async () => {
    const update = vi.fn<MainApp['update']>(() => Promise.resolve({} as MainApp));
    const app = createFoundApp({
      dbHost: 'old-app-db-host',
      dbName: 'app-1',
      dbPort: 5433,
      dbUser: 'app-user',
      id: 1,
      update,
    });
    vi.mocked(App.findAll).mockResolvedValue([app]);

    const failed = await restoreDataFromBackup(baseOptions);

    expect(failed).toBe(false);
    expect(update).toHaveBeenCalledWith({
      dbHost: baseOptions.databaseHost,
      dbPassword: 'encrypted:database-password:test-aes-secret',
      dbPort: baseOptions.databasePort,
      dbUser: baseOptions.databaseUser,
    });
    expect(encrypt).toHaveBeenCalledWith(baseOptions.databasePassword, baseOptions.aesSecret);
  });

  it('should use local development aesSecret when missing in development', async () => {
    process.env.NODE_ENV = 'development';

    const app = createFoundApp({
      dbHost: 'old-app-db-host',
      dbName: 'app-1',
      dbPort: 5433,
      dbUser: 'app-user',
      id: 1,
      update: vi.fn<MainApp['update']>(() => Promise.resolve({} as MainApp)),
    });
    vi.mocked(App.findAll).mockResolvedValue([app]);

    const failed = await restoreDataFromBackup({
      ...baseOptions,
      aesSecret: undefined,
    });

    expect(failed).toBe(false);
    expect(encrypt).toHaveBeenCalledWith(
      baseOptions.databasePassword,
      'Local Appsemble development AES secret',
    );
  });

  it('should return true when restoring main database fails', async () => {
    const app = createFoundApp({
      dbHost: 'old-app-db-host',
      dbName: 'app-1',
      dbPort: 5433,
      dbUser: 'app-user',
      id: 1,
      update: vi.fn<MainApp['update']>(() => Promise.resolve({} as MainApp)),
    });
    vi.mocked(App.findAll).mockResolvedValue([app]);

    let spawnCallCount = 0;
    vi.mocked(spawn).mockImplementation(() => {
      spawnCallCount += 1;
      return createChildProcessMock(spawnCallCount === 3 ? 1 : 0) as unknown as SpawnReturn;
    });

    const failed = await restoreDataFromBackup(baseOptions);

    expect(failed).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to restore main database:',
      expect.any(Error),
    );
  });

  it('should return true when restoring one app database fails', async () => {
    const app1Update = vi.fn<MainApp['update']>(() => Promise.resolve({} as MainApp));
    const app2Update = vi.fn<MainApp['update']>(() => Promise.resolve({} as MainApp));

    const app1 = createFoundApp({
      dbHost: 'old-app-db-host-1',
      dbName: 'app-1',
      dbPort: 5433,
      dbUser: 'app-user-1',
      id: 1,
      update: app1Update,
    });
    const app2 = createFoundApp({
      dbHost: 'old-app-db-host-2',
      dbName: 'app-2',
      dbPort: 5434,
      dbUser: 'app-user-2',
      id: 2,
      update: app2Update,
    });
    vi.mocked(App.findAll).mockResolvedValue([app1, app2]);

    app2Update.mockRejectedValueOnce(new Error('failed app update'));

    const failed = await restoreDataFromBackup(baseOptions);

    expect(failed).toBe(true);
    expect(logger.error).toHaveBeenCalledWith('Failed to restore app 2 database:');
  });

  it('should continue when S3 initialization fails and return false if restore succeeds', async () => {
    vi.mocked(initS3Client).mockImplementationOnce(() => {
      throw new Error('s3 init failed');
    });

    const failed = await restoreDataFromBackup(baseOptions);

    expect(failed).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith('S3Error: Error: s3 init failed');
    expect(logger.warn).toHaveBeenCalledWith(
      'Features related to file uploads will not work correctly!',
    );
  });
});
