import { logger } from '@appsemble/node-utils';
import { TeamRole } from '@appsemble/utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.15.10';

/**
 * Summary:
 * - Add Team table
 * - Add TeamMember table
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding table Team');
  await queryInterface.createTable('Team', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'App',
        key: 'id',
      },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  logger.info('Adding table TeamMember');
  await queryInterface.createTable('TeamMember', {
    role: { type: DataTypes.ENUM(...Object.values(TeamRole)), allowNull: false },
    TeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,

      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'Team',
        key: 'id',
      },
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });
}

/**
 * Summary:
 * - Drop the Team table.
 * - Drop the TeamMember table.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Dropping table TeamMember');
  await queryInterface.dropTable('TeamMember');

  logger.info('Dropping table Team');
  await queryInterface.dropTable('Team');
}
