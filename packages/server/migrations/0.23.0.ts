import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.23.0';

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // Create the 'Training' table
  logger.info('Creating table `Training`');
  await queryInterface.createTable('Training', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    competence: {
      type: DataTypes.STRING,
    },
    difficultyLevel: {
      type: DataTypes.INTEGER,
    },
    created: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updated: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });

  // Create the 'TrainingBlock' table
  logger.info('Creating table `TrainingBlock`');
  await queryInterface.createTable('TrainingBlock', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    TrainingId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      references: {
        model: 'Training',
        key: 'id',
      },
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    documentationLink: {
      type: DataTypes.STRING,
    },
    videoLink: {
      type: DataTypes.STRING,
    },
    exampleCode: {
      type: DataTypes.STRING,
    },
    externalResource: {
      type: DataTypes.STRING,
    },
    created: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updated: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });

  // Create the 'UserTraining' table
  logger.info('Creating table `UserTraining`');
  await queryInterface.createTable('UserTraining', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    TrainingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Training',
        key: 'id',
      },
    },
    completed: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
    },
    created: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updated: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // Rollback the changes in the 'up' function
  await queryInterface.dropTable('UserTraining');
  await queryInterface.dropTable('TrainingBlock');
  await queryInterface.dropTable('Training');
}
