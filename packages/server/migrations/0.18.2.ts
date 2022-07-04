import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.18.2';

/**
 * Summary:
 * - Add columns description, email, and website to table Organization.
 * - Add column role to OrganizationInvite
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column description to Organization');
  await queryInterface.addColumn('Organization', 'description', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column email to Organization');
  await queryInterface.addColumn('Organization', 'email', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column website to Organization');
  await queryInterface.addColumn('Organization', 'website', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column role to OrganizationInvite');
  await queryInterface.addColumn('OrganizationInvite', 'role', {
    type: DataTypes.ENUM('Member', 'Owner', 'Maintainer', 'AppEditor'),
    defaultValue: 'Member',
    allowNull: false,
  });

  logger.info('Adding column showAppsembleLogin to App');
  await queryInterface.addColumn('App', 'showAppsembleLogin', {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  });
}

/**
 * Summary:
 * - Remove columns description, email, and website from table Organization.
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing column description from Organization');
  await queryInterface.removeColumn('Organization', 'description');

  logger.info('Removing column email from Organization');
  await queryInterface.removeColumn('Organization', 'email');

  logger.info('Removing column website from Organization');
  await queryInterface.removeColumn('Organization', 'website');

  logger.info('Removing column role from OrganizationInvite');
  await queryInterface.removeColumn('OrganizationInvite', 'role');
  await db.query('DROP TYPE IF EXISTS "enum_OrganizationInvite_role"');

  logger.info('Removing column showAppsembleLogin from App');
  await queryInterface.removeColumn('App', 'showAppsembleLogin');
}
