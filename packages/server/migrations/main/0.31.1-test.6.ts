import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.31.1-test.6';

/**
 * Summary:
 * - Delete Training, TrainingBlock and UserTraining tables
 * - Create new Training and TrainingCompleted tables
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping `UserTraining` table');
  await queryInterface.dropTable('UserTraining', { transaction });
  logger.info('Dropping `TrainingBlock` table');
  await queryInterface.dropTable('TrainingBlock', { transaction });
  logger.info('Dropping old `Training` table');
  await queryInterface.dropTable('Training', { transaction });

  logger.info('Creating table `Training`');
  await queryInterface.createTable(
    'Training',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );

  logger.info('Creating table `TrainingCompleted`');
  await queryInterface.createTable(
    'TrainingCompleted',
    {
      TrainingId: {
        type: DataTypes.STRING,
        primaryKey: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: { model: 'Training', key: 'id' },
      },
      UserId: {
        type: DataTypes.UUID,
        primaryKey: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: { model: 'User', key: 'id' },
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Delete Training and TrainingCompleted tables
 * - Create new Training, TrainingBlock and UserTraining tables
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Dropping `TrainingCompleted` table');
  await queryInterface.dropTable('TrainingCompleted', { transaction });
  logger.info('Dropping old `Training` table');
  await queryInterface.dropTable('Training', { transaction });

  logger.info('Creating table `Training`');
  await queryInterface.createTable(
    'Training',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      difficultyLevel: { type: DataTypes.INTEGER, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      competences: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
    },
    { transaction },
  );

  logger.info('Creating table `TrainingBlock`');
  await queryInterface.createTable(
    'TrainingBlock',
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      TrainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Training', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      documentationLink: { type: DataTypes.STRING(255), allowNull: true },
      videoLink: { type: DataTypes.STRING(255), allowNull: true },
      exampleCode: { type: DataTypes.TEXT, allowNull: true },
      externalResource: { type: DataTypes.STRING(255), allowNull: true },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  logger.info('Creating table `UserTraining`');
  await queryInterface.createTable(
    'UserTraining',
    {
      id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      UserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      TrainingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Training', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      completed: { type: DataTypes.BOOLEAN, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex('UserTraining', ['UserId', 'TrainingId'], {
    name: 'UserTraining_UserId_TrainingId_key',
    unique: true,
    transaction,
  });
}
