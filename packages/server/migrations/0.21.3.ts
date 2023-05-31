import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.21.3';

/**
 * Summary:
 * - Create a `AppEmailQuotaLog` table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.createTable('AppEmailQuotaLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true },
    AppId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'App',
        key: 'id',
      },
    },
    created: { allowNull: false, type: DataTypes.DATE },
  });
}

/**
 * Summary:
 * - Drop `AppEmailQuotaLog` table
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.dropTable('AppEmailQuotaLog');
}
