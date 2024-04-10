import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.27.12';

/**
 * Summary:
 * - Create the AppVariable table.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Creating the `AppVariable` table');
  await queryInterface.createTable('AppVariable', {
    id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: 'UniqueNameIndex' },
    value: { type: DataTypes.STRING },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'App',
        key: 'id',
      },
      unique: 'UniqueNameIndex',
    },
    created: { allowNull: false, type: DataTypes.DATE },
    updated: { allowNull: false, type: DataTypes.DATE },
  });
}

/**
 * Summary:
 * - Drop the AppVariable table.
 *
 * @param db The sequelize Database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping the `AppVariable` table');
  await queryInterface.dropTable('AppVariable');
}
