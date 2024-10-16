import { randomUUID } from 'node:crypto';

import { setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import axiosSnapshotSerializer, { setResponseTransformer } from 'jest-axios-snapshot';
// @ts-expect-error We define this manually to make it compatible with Vite.
// https://vitest.dev/guide/snapshot.html#image-snapshots
// eslint-disable-next-line import/no-extraneous-dependencies
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { type Sequelize } from 'sequelize';
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, beforeEach, expect } from 'vitest';

import { setupTestDatabase } from './utils/test/testSchema.js';

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
});

beforeEach(async () => {
  await testDB.truncate({ truncate: true, cascade: true, force: true, restartIdentity: true });
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
