import { logger } from '@appsemble/node-utils';
import { DataTypes, Sequelize } from 'sequelize';

export const key = '0.20.3';

/**
 * Summary:
 * - Add table `TeamInvite`
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding table `TeamInvite` ');
  await queryInterface.createTable('TeamInvite', {
    TeamId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'Team', key: 'id' },
      allowNull: false,
    },
    email: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Remove table `TeamInvite`
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Removing table `TeamInvite`');
  await queryInterface.dropTable('TeamInvite');
}
