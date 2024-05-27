import { AppsembleError } from '@appsemble/node-utils';
import { beforeEach, expect, it, type Mock, vi } from 'vitest';

import { migrate, type Migration } from './migrate.js';
import { useTestDatabase } from './test/testSchema.js';
import { getDB, Meta } from '../models/index.js';

let m000: Migration;
let m001: Migration;
let m002: Migration;
let m003: Migration;
let m010: Migration;
let m100: Migration;
let migrations: Migration[];

useTestDatabase(import.meta);

beforeEach(() => {
  m000 = { key: '0.0.0', up: vi.fn(), down: vi.fn() };
  m001 = { key: '0.0.1', up: vi.fn(), down: vi.fn() };
  m002 = { key: '0.0.2', up: vi.fn(), down: vi.fn() };
  m003 = { key: '0.0.3', up: vi.fn(), down: vi.fn() };
  m010 = { key: '0.1.0', up: vi.fn(), down: vi.fn() };
  m100 = { key: '1.0.0', up: vi.fn(), down: vi.fn() };
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

it('should apply all migrations to database if no meta version is present', async () => {
  vi.spyOn(Meta, 'update');
  await migrate('1.0.0', migrations);
  expect(m000.up).toHaveBeenCalledWith(getDB());
  expect(m001.up).toHaveBeenCalledWith(getDB());
  expect(m002.up).toHaveBeenCalledWith(getDB());
  expect(m003.up).toHaveBeenCalledWith(getDB());
  expect(m010.up).toHaveBeenCalledWith(getDB());
  expect(m100.up).toHaveBeenCalledWith(getDB());
  expect(m000.down).not.toHaveBeenCalled();
  expect(m001.down).not.toHaveBeenCalled();
  expect(m002.down).not.toHaveBeenCalled();
  expect(m003.down).not.toHaveBeenCalled();
  expect(m010.down).not.toHaveBeenCalled();
  expect(m100.down).not.toHaveBeenCalled();
  expect(Meta.update).toHaveBeenCalledWith({ version: m000.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m001.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m002.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m003.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m010.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m100.key }, expect.any(Object));
  const meta = await Meta.findAll({ raw: true });
  expect(meta).toStrictEqual([{ version: '1.0.0' }]);
});

it('should downgrade if the given version is lower than the database meta version', async () => {
  vi.spyOn(Meta, 'update');
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
  expect(Meta.update).toHaveBeenCalledWith({ version: m003.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m002.key }, expect.any(Object));
  const updatedMeta = await Meta.findAll({ raw: true });
  expect(updatedMeta).toStrictEqual([{ version: '0.0.2' }]);
});

it('should upgrade if the given version is higher than the database meta version', async () => {
  vi.spyOn(Meta, 'update');
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
  expect(Meta.update).toHaveBeenCalledWith({ version: m002.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m003.key }, expect.any(Object));
  expect(Meta.update).toHaveBeenCalledWith({ version: m010.key }, expect.any(Object));
  const updatedMeta = await Meta.findAll({ raw: true });
  expect(updatedMeta).toStrictEqual([{ version: '0.1.0' }]);
});

it('should run downgrades in sequence', async () => {
  await Meta.create({ version: '0.0.3' });
  let resolve: () => void;
  (m003.down as Mock).mockReturnValue(
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
  (m001.up as Mock).mockReturnValue(
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
