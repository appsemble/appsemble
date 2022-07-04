import { logger } from '@appsemble/node-utils';
import { Sequelize } from 'sequelize';

export const key = '0.13.12';

/**
 * Symmary:
 * - Rename style to coreStyle in App
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Renaming column style to coreStyle in App');
  await queryInterface.renameColumn('App', 'style', 'coreStyle');
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Renaming column coreStyle to style in App');
  await queryInterface.renameColumn('App', 'coreStyle', 'style');
}
