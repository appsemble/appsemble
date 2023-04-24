import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.19.14';

/**
 * Summary:
 * - Add ResourceVersion table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Creating ResourceVersion table');
  await queryInterface.createTable('ResourceVersion', {
    id: { type: DataTypes.UUID, primaryKey: true },
    data: { type: DataTypes.JSON },
    ResourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Resource', key: 'id' },
    },
    UserId: { type: DataTypes.UUID, references: { model: 'User', key: 'id' } },
    created: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Remove ResourceVersion table
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.warn('Deleting table ResourceVersion');
  await queryInterface.dropTable('ResourceVersion');
}
