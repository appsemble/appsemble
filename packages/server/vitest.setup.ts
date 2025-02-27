import { randomUUID } from 'node:crypto';

import {
  clearAllS3Buckets,
  initS3Client,
  setFixtureBase,
  setLogLevel,
} from '@appsemble/node-utils';
import axiosSnapshotSerializer, { setResponseTransformer } from 'jest-axios-snapshot';
// @ts-expect-error We define this manually to make it compatible with Vite.
// https://vitest.dev/guide/snapshot.html#image-snapshots
// eslint-disable-next-line import/no-extraneous-dependencies
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { type Sequelize } from 'sequelize';
// eslint-disable-next-line import/no-extraneous-dependencies
import { afterAll, beforeAll, beforeEach, expect, vi } from 'vitest';

import { rootDB, setupTestDatabase } from './utils/test/testSchema.js';

interface CustomMatchers<R = unknown> {
  toMatchImageSnapshot: () => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

setFixtureBase(import.meta);
setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

let testDB: Sequelize;

beforeAll(async () => {
  [testDB] = await setupTestDatabase(randomUUID());
  await testDB.sync();
  await initS3Client({
    accessKey: 'admin',
    secretKey: 'password',
    endPoint: process.env.S3_HOST || 'localhost',
    port: Number(process.env.S3_PORT) || 9009,
    useSSL: false,
  });
});

beforeEach(async () => {
  await testDB.truncate({ truncate: true, cascade: true, force: true, restartIdentity: true });
  vi.useRealTimers();
  await clearAllS3Buckets();
});

afterAll(() => {
  testDB.close();
  // We need to drop the test database from the root database
  // testDB.drop() doesn't actually delete the database
  rootDB.query(`DROP DATABASE ${testDB.getDatabaseName()}`);
});

setResponseTransformer(
  ({
    headers: {
      'accept-ranges': acceptRanges,
      'access-control-allow-origin': accessControlAllowOrigin,
      connection,
      'content-length': contentLength,
      date,
      'keep-alive': keepAlive,
      vary,
      ...headers
    },
    ...response
  }) => ({
    ...response,
    headers,
  }),
);

// @ts-expect-error The type definitions are incompatible, but this is fine.
expect.addSnapshotSerializer(axiosSnapshotSerializer);
