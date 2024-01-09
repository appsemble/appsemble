import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.24.0';

/**
 * Summary:
 * - Change datatype of the column `TrainingBlock.exampleCode` to text from string.
 * - Change datatype of the column `Training.competence` to array.
 * - Rename column name of `Training.competence` to 'competences'.
 *
 * @param db The sequelize database.
 */

export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing data type of column `TrainingBlock`.exampleCode to TEXT');
  await queryInterface.changeColumn('TrainingBlock', 'exampleCode', {
    type: DataTypes.TEXT,
  });

  logger.info('Changing datatype of the column `Training`.competence to array');
  await queryInterface.renameColumn('Training', 'competence', 'competence_old');

  await queryInterface.addColumn('Training', 'competences', {
    type: DataTypes.ARRAY(DataTypes.STRING),
  });

  const rows = await queryInterface.sequelize.query('SELECT id, competence_old FROM "Training"');
  for (const row of rows[0]) {
    const updatedValue = (row as any).competence_old;
    await queryInterface.sequelize.query(
      'UPDATE "Training" SET "competences" = ARRAY[:updatedValue] WHERE id = :id',
      {
        replacements: { updatedValue, id: (row as any).id },
      },
    );
  }

  await queryInterface.removeColumn('Training', 'competence_old');
}

/**
 * Summary:
 * - Change datatype of the column `TrainingBlock.exampleCode` to string from text.
 * - Change datatype of the column `Training.competence` to string.
 * - Revert renaming of the column `Training.competences` back to 'competence'.
 *
 * @param db The sequelize database.
 */

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Changing data type of column `TrainingBlock`.exampleCode to STRING');
  await queryInterface.changeColumn('TrainingBlock', 'exampleCode', {
    type: DataTypes.STRING,
  });

  logger.info('Reverting column name `Training`.competences to `competence`');
  await queryInterface.renameColumn('Training', 'competences', 'competence');

  logger.info('Changing datatype of the column `TrainingBlock`.competence to STRING');
  await queryInterface.changeColumn('Training', 'competence', {
    type: DataTypes.STRING,
  });
}
