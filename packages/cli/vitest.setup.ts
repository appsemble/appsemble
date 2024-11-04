import { randomUUID } from 'node:crypto';

import { CREDENTIALS_ENV_VAR, setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import { rootDB, setupTestDatabase } from '@appsemble/server';
import { type Sequelize } from 'sequelize';
// eslint-disable-next-line import/no-extraneous-dependencies
import { afterAll, beforeAll, beforeEach } from 'vitest';

setFixtureBase(import.meta);
delete process.env[CREDENTIALS_ENV_VAR];
setLogLevel(0);

let testDB: Sequelize;

beforeAll(async () => {
  [testDB] = await setupTestDatabase(randomUUID());
  await testDB.sync();
});

beforeEach(async () => {
  await testDB.truncate({ truncate: true, cascade: true, force: true, restartIdentity: true });
});

afterAll(() => {
  testDB.close();
  // We need to drop the test database from the root database
  // testDB.drop() doesn't actually delete the database
  rootDB.query(`DROP DATABASE ${testDB.getDatabaseName()}`);
});
