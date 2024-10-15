import { randomUUID } from 'node:crypto';

import { CREDENTIALS_ENV_VAR, setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import { setupTestDatabase } from '@appsemble/server';
import { type Sequelize } from 'sequelize';
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, beforeEach } from 'vitest';

setFixtureBase(import.meta);
delete process.env[CREDENTIALS_ENV_VAR];
setLogLevel(0);

let testDB: Sequelize;

beforeAll(async () => {
  [testDB] = await setupTestDatabase(randomUUID().slice(0, 10));
});

beforeEach(async () => {
  await testDB.sync({ force: true });
});
