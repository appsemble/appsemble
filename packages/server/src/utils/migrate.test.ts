import { AppsembleError } from '@appsemble/node-utils';

import { getDB, Meta } from '../models';
import { migrate, Migration } from './migrate';
import { useTestDatabase } from './test/testSchema';

let m000: Migration;
let m001: Migration;
let m002: Migration;
let m003: Migration;
let m010: Migration;
let m100: Migration;
let migrations: Migration[];

useTestDatabase('migrate');

beforeEach(() => {
  m000 = { key: '0.0.0', up: jest.fn(), down: jest.fn() };
  m001 = { key: '0.0.1', up: jest.fn(), down: jest.fn() };
  m002 = { key: '0.0.2', up: jest.fn(), down: jest.fn() };
  m003 = { key: '0.0.3', up: jest.fn(), down: jest.fn() };
  m010 = { key: '0.1.0', up: jest.fn(), down: jest.fn() };
  m100 = { key: '1.0.0', up: jest.fn(), down: jest.fn() };
  migrations = [m000, m001, m002, m003, m010, m100];
});

it('should fail if multiple meta entries are found', async () => {
  await Meta.create({ version: '0.0.0' });
  await Meta.create({ version: '1.2.3' });
  await expect(migrate(null, [])).rejects.toThrow(AppsembleError);
  await expect(migrate(null, [])).rejects.toThrow(
    'Multiple Meta entries found. The database requires a manual fix.',
  );
});

it('should sync the database if no meta version is present', async () => {
  jest.spyOn(getDB(), 'sync');
  await migrate('1.0.0', migrations);
  expect(getDB().sync).toHaveBeenCalledWith();
  const meta = await Meta.findAll({ raw: true });
  expect(meta).toStrictEqual([{ version: '1.0.0' }]);
  expect(m000.up).not.toHaveBeenCalled();
  expect(m001.up).not.toHaveBeenCalled();
  expect(m002.up).not.toHaveBeenCalled();
  expect(m003.up).not.toHaveBeenCalled();
  expect(m010.up).not.toHaveBeenCalled();
  expect(m100.up).not.toHaveBeenCalled();
  expect(m000.down).not.toHaveBeenCalled();
  expect(m001.down).not.toHaveBeenCalled();
  expect(m002.down).not.toHaveBeenCalled();
  expect(m003.down).not.toHaveBeenCalled();
  expect(m010.down).not.toHaveBeenCalled();
  expect(m100.down).not.toHaveBeenCalled();
});

it('should downgrade if the given version is lower than the database meta version', async () => {
  await Meta.create({ version: '0.1.0' });
  await migrate('0.0.2', migrations);
  expect(m000.up).not.toHaveBeenCalled();
  expect(m001.up).not.toHaveBeenCalled();
  expect(m002.up).not.toHaveBeenCalled();
  expect(m003.up).not.toHaveBeenCalled();
  expect(m010.up).not.toHaveBeenCalled();
  expect(m100.up).not.toHaveBeenCalled();
  expect(m000.down).not.toHaveBeenCalled();
  expect(m001.down).not.toHaveBeenCalled();
  expect(m002.down).not.toHaveBeenCalled();
  expect(m003.down).toHaveBeenCalledWith(getDB());
  expect(m010.down).toHaveBeenCalledWith(getDB());
  expect(m100.down).not.toHaveBeenCalled();
  const updatedMeta = await Meta.findAll({ raw: true });
  expect(updatedMeta).toStrictEqual([{ version: '0.0.2' }]);
});

it('should upgrade if the given version is higher than the database meta version', async () => {
  await Meta.create({ version: '0.0.1' });
  await migrate('0.1.0', migrations);
  expect(m000.up).not.toHaveBeenCalled();
  expect(m001.up).not.toHaveBeenCalled();
  expect(m002.up).toHaveBeenCalledWith(getDB());
  expect(m003.up).toHaveBeenCalledWith(getDB());
  expect(m010.up).toHaveBeenCalledWith(getDB());
  expect(m100.up).not.toHaveBeenCalled();
  expect(m000.down).not.toHaveBeenCalled();
  expect(m001.down).not.toHaveBeenCalled();
  expect(m002.down).not.toHaveBeenCalled();
  expect(m003.down).not.toHaveBeenCalled();
  expect(m010.down).not.toHaveBeenCalled();
  expect(m100.down).not.toHaveBeenCalled();
  const updatedMeta = await Meta.findAll({ raw: true });
  expect(updatedMeta).toStrictEqual([{ version: '0.1.0' }]);
});

it('should run downgrades in sequence', async () => {
  await Meta.create({ version: '0.0.3' });
  let resolve: () => void;
  (m003.down as jest.Mock).mockReturnValue(
    new Promise<void>((r) => {
      resolve = r;
    }),
  );
  const pendingMigration = migrate('0.0.1', migrations);
  expect(m002.down).not.toHaveBeenCalled();
  resolve();
  await pendingMigration;
  expect(m002.down).toHaveBeenCalledWith(getDB());
});

it('should run upgrades in sequence', async () => {
  await Meta.create({ version: '0.0.1' });
  let resolve: () => void;
  (m001.up as jest.Mock).mockReturnValue(
    new Promise<void>((r) => {
      resolve = r;
    }),
  );
  const pendingMigration = migrate('0.0.2', migrations);
  expect(m002.up).not.toHaveBeenCalled();
  resolve();
  await pendingMigration;
  expect(m002.up).toHaveBeenCalledWith(getDB());
});
