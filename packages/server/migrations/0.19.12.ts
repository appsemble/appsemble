import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.19.12';

/**
 * Summary:
 * - Make column `Resource`.`type` non nullable.
 * - Make column `Resource`.`data` non nullable.
 * - Make column `Resource`.`AppId` non nullable.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Making column `Resource`.`type` non nullable');
  await queryInterface.changeColumn('Resource', 'type', {
    allowNull: false,
    type: DataTypes.STRING,
  });

  logger.info('Making column `Resource`.`data` non nullable');
  await queryInterface.changeColumn('Resource', 'data', {
    allowNull: false,
    type: DataTypes.JSON,
  });

  logger.info('Making column `Resource`.`AppId` non nullable');
  await queryInterface.changeColumn('Resource', 'AppId', {
    allowNull: false,
    type: DataTypes.INTEGER,
  });

  logger.info('Renaming column `Resource`.`UserId` to `Resource`.`AuthorId`');
  await queryInterface.renameColumn('Resource', 'UserId', 'AuthorId');
}

/**
 * Summary:
 * - Make column `Resource`.`AppId` nullable.
 * - Make column `Resource`.`data` nullable.
 * - Make column `Resource`.`type` nullable.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Renaming column `Resource`.`AuthorId` to `Resource`.`UserId`');
  await queryInterface.renameColumn('Resource', 'AuthorId', 'UserId');

  logger.info('Making column `Resource`.`AppId` non nullable');
  await queryInterface.changeColumn('Resource', 'AppId', {
    allowNull: false,
    type: DataTypes.INTEGER,
  });

  logger.info('Making column `Resource`.`data` non nullable');
  await queryInterface.changeColumn('Resource', 'data', {
    allowNull: false,
    type: DataTypes.JSON,
  });

  logger.info('Making column `Resource`.`type` non nullable');
  await queryInterface.changeColumn('Resource', 'type', {
    allowNull: false,
    type: DataTypes.STRING,
  });
}
