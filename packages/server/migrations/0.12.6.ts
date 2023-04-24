import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.12.6';

/**
 * Summary:
 * - Add an icon column for block versions
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.addColumn('BlockVersion', 'icon', {
    type: DataTypes.BLOB,
    allowNull: true,
  });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  await queryInterface.removeColumn('BlockVersion', 'icon');
}
