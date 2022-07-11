import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.13.11';

/**
 * Symmary:
 * - Remove column coreStyle from Organization.
 * - Remove column sharedStyle from Organization.
 * - Drop the OrganizationBlockStyle table.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Removing column coreStyle from Organization');
  await queryInterface.removeColumn('Organization', 'coreStyle');

  logger.warn('Removing column sharedStyle from Organization');
  await queryInterface.removeColumn('Organization', 'sharedStyle');

  logger.warn('Dropping table OrganizationBlockStyle');
  await queryInterface.dropTable('OrganizationBlockStyle');
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding new table OrganizationBlockStyle');
  await queryInterface.createTable('OrganizationBlockStyle', {
    OrganizationId: {
      primaryKey: true,
      type: DataTypes.STRING,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { model: 'Organization', key: 'id' },
    },
    block: { primaryKey: true, type: DataTypes.STRING, allowNull: false },
    style: { primaryKey: true, type: DataTypes.TEXT, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { model: 'App', key: 'id' },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
    deleted: { type: DataTypes.DATE },
  });

  logger.info('Adding column sharedStyle to Organization');
  await queryInterface.addColumn('Organization', 'sharedStyle', { type: DataTypes.TEXT });

  logger.info('Adding column coreStyle to Organization');
  await queryInterface.addColumn('Organization', 'coreStyle', { type: DataTypes.TEXT });
}
