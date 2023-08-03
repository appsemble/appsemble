import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.21.2';

/**
 * Summary:
 * - Remove columns `OrganizationId` from table `Organization`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column `OrganizationId` from `Organization`');
  await queryInterface.removeColumn('Organization', 'OrganizationId');
}

/**
 * Summary:
 * - Re-add columns `OrganizationId` to table `Organization`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Adding column `OrganizationId` to `Organization`');
  await queryInterface.addColumn('Organization', 'OrganizationId', {
    type: DataTypes.UUID,
    allowNull: false,
  });
}
