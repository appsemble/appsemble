import { logger } from '@appsemble/node-utils';
import { type AppLock } from '@appsemble/types';
import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

export const key = '0.24.13';

/**
 * Summary:
 * - Change data type of the column App.locked to enum.
 */

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new column `locked-temp` locked to table `App`');
  await queryInterface.addColumn('App', 'locked-temp', {
    type: DataTypes.ENUM,
    values: ['fullLock', 'studioLock', 'unlocked'],
    defaultValue: 'unlocked',
  });

  logger.info('Moving data from locked to locked-temp');
  const rows = await queryInterface.sequelize.query<{ id: number; locked: boolean }>(
    'SELECT id, locked from "App"',
    { type: QueryTypes.SELECT },
  );
  for (const row of rows) {
    const updatedValue = row.locked ? 'studioLock' : 'unlocked';
    await queryInterface.sequelize.query(
      'UPDATE "App" SET "locked-temp" = :updatedValue WHERE id = :id',
      {
        replacements: { id: row.id, updatedValue },
      },
    );
  }

  logger.info('Removing column locked from table App');
  await queryInterface.removeColumn('App', 'locked');
  logger.info('Renaming column locked-temp to locked in table App');
  await queryInterface.renameColumn('App', 'locked-temp', 'locked');
}

/**
 * - Change data type of the column App.locked to boolean.
 */

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new column "locked-temp" to table "App"');
  await queryInterface.addColumn('App', 'locked-temp', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });

  logger.info('Moving data from locked to locked-temp');
  const rows = await queryInterface.sequelize.query<{ id: number; locked: AppLock }>(
    'SELECT id, locked from "App"',
    { type: QueryTypes.SELECT },
  );
  for (const row of rows) {
    const updatedValue = row.locked !== 'unlocked';
    await queryInterface.sequelize.query(
      'UPDATE "App" SET "locked-temp" = :updatedValue WHERE id = :id',
      {
        replacements: { id: row.id, updatedValue },
      },
    );
  }

  logger.info('Removing column locked from table App');
  await queryInterface.removeColumn('App', 'locked');
  logger.info('Renaming column locked-temp to locked in table App');
  await queryInterface.renameColumn('App', 'locked-temp', 'locked');
}
