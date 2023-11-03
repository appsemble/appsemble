import { type Sequelize } from 'sequelize';

export const key = '0.23.1';

/**
 * Summary:
 * - Adds `demoMode` column to `App`
 * - Adds `demoLoginUser` column to `User`
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.addColumn('App', 'demoMode', {
    type: 'boolean',
    allowNull: false,
    defaultValue: false,
  });
  await queryInterface.addColumn('User', 'demoLoginUser', {
    type: 'boolean',
    allowNull: false,
    defaultValue: false,
  });
}

/**
 * Summary:
 * - Removes `demoMode` column from `App`
 * - Removes `demoLoginUser` column from `User`
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.removeColumn('App', 'demoMode');
  await queryInterface.removeColumn('User', 'demoLoginUser');
}
