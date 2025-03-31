import { AppsembleError, logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, Transaction } from 'sequelize';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { migrate, type Migration } from './migrate.js';
import { getDB, Meta } from '../models/index.js';

let m000: Migration;
let m001: Migration;
let m002: Migration;
let m003: Migration;
let m010: Migration;
let m100: Migration;
let migrations: Migration[];

describe('migrate', () => {
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
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await expect(migrate(null, [])).rejects.toThrow(AppsembleError);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await expect(migrate(null, [])).rejects.toThrow(
      'Multiple Meta entries found. The database requires a manual fix.',
    );
  });

  it('should apply all migrations to database if no meta version is present', async () => {
    vi.spyOn(Meta, 'create');
    vi.spyOn(Meta, 'update');
    await migrate('1.0.0', migrations);
    expect(m000.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m001.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m002.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m003.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m010.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m100.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m000.down).not.toHaveBeenCalled();
    expect(m001.down).not.toHaveBeenCalled();
    expect(m002.down).not.toHaveBeenCalled();
    expect(m003.down).not.toHaveBeenCalled();
    expect(m010.down).not.toHaveBeenCalled();
    expect(m100.down).not.toHaveBeenCalled();
    expect(Meta.create).toHaveBeenCalledWith({ version: m000.key });
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
    expect(m003.down).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m010.down).toHaveBeenCalledWith(expect.any(Transaction), getDB());
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
    expect(m002.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m003.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
    expect(m010.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolve: () => void = () => {};
    (m003.down as Mock).mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    const pendingMigration = migrate('0.0.1', migrations);
    expect(m002.down).not.toHaveBeenCalled();
    resolve();
    await pendingMigration;
    expect(m002.down).toHaveBeenCalledWith(expect.any(Transaction), getDB());
  });

  it('should run upgrades in sequence', async () => {
    await Meta.create({ version: '0.0.1' });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolve: () => void = () => {};
    (m001.up as Mock).mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    const pendingMigration = migrate('0.0.2', migrations);
    expect(m002.up).not.toHaveBeenCalled();
    resolve();
    await pendingMigration;
    expect(m002.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
  });

  describe('handleMigration', () => {
    it('should migrate', async () => {
      const m02412 = { key: '0.24.12', up: vi.fn(), down: vi.fn() };
      const m02413 = {
        key: '0.24.13',
        up: vi.fn(async (transaction: Transaction, db: Sequelize) => {
          const queryInterface = db.getQueryInterface();
          await queryInterface.createTable(
            'Test',
            {
              id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
              },
            },
            { transaction },
          );
        }),
        down: vi.fn(),
      };

      await migrate('0.24.13', [m02412, m02413]);

      expect((await getDB().query('SELECT * FROM "Test";'))[0]).toStrictEqual([]);
      expect(m02412.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02413.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02412.down).not.toHaveBeenCalled();
      expect(m02413.down).not.toHaveBeenCalled();

      await getDB().query('DROP TABLE "Test";');
    });

    it('should rollback', async () => {
      const m02412 = { key: '0.24.12', up: vi.fn(), down: vi.fn() };
      const m02413 = {
        key: '0.24.13',
        up: vi.fn(async (transaction: Transaction, db: Sequelize) => {
          const queryInterface = db.getQueryInterface();
          await queryInterface.createTable(
            'Test',
            {
              id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
              },
            },
            { transaction },
          );
          throw new Error('test');
        }),
        down: vi.fn(),
      };

      await expect(migrate('0.24.13', [m02412, m02413])).rejects.toThrow('test');
      await expect(getDB().query('SELECT * FROM "Test";')).rejects.toThrow(
        'relation "Test" does not exist',
      );

      expect(m02412.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02413.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02412.down).not.toHaveBeenCalled();
      expect(m02413.down).not.toHaveBeenCalled();
    });

    it('should log first migration failure instructions', async () => {
      vi.spyOn(logger, 'warn');
      const m02412 = {
        key: '0.24.12',
        up: vi.fn(() => {
          throw new Error('test');
        }),
        down: vi.fn(),
      };
      const m02413 = { key: '0.24.13', up: vi.fn(), down: vi.fn() };

      await expect(migrate('0.24.13', [m02412, m02413])).rejects.toThrow('test');

      expect(m02412.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02413.up).not.toHaveBeenCalled();
      expect(m02412.down).not.toHaveBeenCalled();
      expect(m02413.down).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith('No old database meta information was found.');
      expect(logger.warn).toHaveBeenCalledWith(
        'Upgrade to 0.24.12 unsuccessful, not committing. Please make sure to start from an empty database.',
      );

      const metas = await Meta.findAll({ raw: true });
      expect(metas).toStrictEqual([]);
    });

    it('should log upgrade migration failure instructions', async () => {
      vi.spyOn(logger, 'warn');
      const m02412 = { key: '0.24.12', up: vi.fn(), down: vi.fn() };
      const m02413 = {
        key: '0.24.13',
        up: vi.fn(() => {
          throw new Error('test');
        }),
        down: vi.fn(),
      };

      await expect(migrate('0.24.13', [m02412, m02413])).rejects.toThrow('test');

      expect(m02412.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02413.up).toHaveBeenCalledWith(expect.any(Transaction), getDB());
      expect(m02412.down).not.toHaveBeenCalled();
      expect(m02413.down).not.toHaveBeenCalled();

      expect(logger.warn).toHaveBeenCalledWith('No old database meta information was found.');
      expect(logger.warn).toHaveBeenCalledWith(
        'Upgrade to 0.24.13 unsuccessful, not committing. Current database version 0.24.12.',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `In case this occurred on a hosted Appsemble instance,
and the logs above do not contain warnings to resolve the below error manually,
consider contacting \`support@appsemble.com\` to report the migration issue,
and include the stacktrace.`,
      );

      const metas = await Meta.findAll({ raw: true });
      expect(metas).toStrictEqual([{ version: '0.24.12' }]);
    });

    it('should log downgrade migration failure instructions', async () => {
      await Meta.create({ version: '0.24.13' });
      vi.spyOn(logger, 'warn');
      const m02412 = { key: '0.24.12', up: vi.fn(), down: vi.fn() };
      const m02413 = {
        key: '0.24.13',
        up: vi.fn(),
        down: vi.fn(() => {
          throw new Error('test');
        }),
      };

      await expect(migrate('0.24.12', [m02412, m02413])).rejects.toThrow('test');

      expect(m02412.up).not.toHaveBeenCalled();
      expect(m02413.up).not.toHaveBeenCalled();
      expect(m02412.down).not.toHaveBeenCalled();
      expect(m02413.down).toHaveBeenCalledWith(expect.any(Transaction), getDB());

      expect(logger.warn).toHaveBeenCalledWith(
        'Downgrade from 0.24.13 unsuccessful, not committing. Current database version 0.24.13.',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `In case this occurred on a hosted Appsemble instance,
and the logs above do not contain warnings to resolve the below error manually,
consider contacting \`support@appsemble.com\` to report the migration issue,
and include the stacktrace.`,
      );

      const metas = await Meta.findAll({ raw: true });
      expect(metas).toStrictEqual([{ version: '0.24.13' }]);
    });
  });
});
