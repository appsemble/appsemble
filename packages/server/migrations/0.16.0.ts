import { AppsembleError, logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.16.0';

/**
 * Summary:
 * - Change the type of Asset.id to string.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing column Asset.id to String type');
  await queryInterface.addColumn('Asset', 'newId', DataTypes.STRING);
  await db.query('UPDATE "Asset" set "newId" = CAST (id AS text)');
  await queryInterface.removeColumn('Asset', 'id');
  await queryInterface.renameColumn('Asset', 'newId', 'id');
  await queryInterface.changeColumn('Asset', 'id', { type: DataTypes.STRING, allowNull: false });
  await queryInterface.addConstraint('Asset', {
    fields: ['id'],
    type: 'primary key',
    name: 'Asset_pkey',
  });

  logger.info('Adding column ResourceID to table Asset');
  await queryInterface.addColumn('Asset', 'ResourceId', {
    type: DataTypes.INTEGER,
    references: { model: 'Resource', key: 'id' },
    onDelete: 'cascade',
    onUpdate: 'cascade',
  });
}

/**
 * Cancel futher down migrations.
 */
export function down(): Promise<void> {
  throw new AppsembleError(
    'Due to potential data loss, down migrations from 0.16.0 are not supported.',
  );
}
