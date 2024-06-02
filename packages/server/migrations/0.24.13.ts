import { logger } from '@appsemble/node-utils';
import { type AppLock } from '@appsemble/types';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.24.13';

/**
 * Summary:
 * - Change data type of the column App.locked to enum.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new column `locked-temp` locked to table `App`');
  await queryInterface.addColumn(
    'App',
    'locked-temp',
    {
      type: DataTypes.ENUM,
      values: ['fullLock', 'studioLock', 'unlocked'],
      defaultValue: 'unlocked',
    },
    { transaction },
  );

  logger.info('Moving data from locked to locked-temp');
  const rows = await queryInterface.sequelize.query<{ id: number; locked: boolean }>(
    'SELECT id, locked from "App"',
    { type: QueryTypes.SELECT, transaction },
  );
  for (const row of rows) {
    const updatedValue = row.locked ? 'studioLock' : 'unlocked';
    await queryInterface.sequelize.query(
      'UPDATE "App" SET "locked-temp" = :updatedValue WHERE id = :id',
      {
        replacements: { id: row.id, updatedValue },
        transaction,
      },
    );
  }

  logger.info('Removing column locked from table App');
  await queryInterface.removeColumn('App', 'locked', { transaction });
  logger.info('Renaming column locked-temp to locked in table App');
  await queryInterface.renameColumn('App', 'locked-temp', 'locked', { transaction });
}

/**
 * - Change data type of the column App.locked to boolean.
 * - Remove enum enum_App_locked-temp
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new column "locked-temp" to table "App"');
  await queryInterface.addColumn(
    'App',
    'locked-temp',
    {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Moving data from locked to locked-temp');
  const rows = await queryInterface.sequelize.query<{ id: number; locked: AppLock }>(
    'SELECT id, locked from "App"',
    { type: QueryTypes.SELECT, transaction },
  );
  for (const row of rows) {
    const updatedValue = row.locked !== 'unlocked';
    await queryInterface.sequelize.query(
      'UPDATE "App" SET "locked-temp" = :updatedValue WHERE id = :id',
      {
        replacements: { id: row.id, updatedValue },
        transaction,
      },
    );
  }

  logger.info('Removing column locked from table App');
  await queryInterface.removeColumn('App', 'locked', { transaction });
  logger.info('Renaming column locked-temp to locked in table App');
  await queryInterface.renameColumn('App', 'locked-temp', 'locked', { transaction });
  logger.info('Removing type enum enum_App_locked-temp');
  await queryInterface.sequelize.query('DROP TYPE "enum_App_locked-temp";', { transaction });
}
