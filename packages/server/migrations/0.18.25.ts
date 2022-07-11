import { logger } from '@appsemble/node-utils';
import { lookup } from 'mime-types';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import sharp from 'sharp';

export const key = '0.18.25';

interface QueryResult {
  id: string;
  screenshot: string;
}

/**
 * Summary:
 * - Add column `wildcardActions` to table `BlockVersion`.
 * - Add column `name` to table `Asset`.
 * - Add column `width` to table `AppScreenshot`.
 * - Add column `height` to table `AppScreenshot`.
 * - Add column `mime` to table `AppScreenshot`.
 * - Add `width`, `height`, and `mime` to existing entries.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column wildcardActions to BlockVersion');
  await queryInterface.addColumn('BlockVersion', 'wildcardActions', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });

  logger.info('Updating existing block versions to have `wildcardActions` set to `false`');
  await db.query('UPDATE "BlockVersion" SET "wildcardActions" = false;', {
    type: QueryTypes.UPDATE,
  });

  logger.info('Updating `wildcardActions` in `BlockVersion` to not be nullable');
  await queryInterface.changeColumn('BlockVersion', 'wildcardActions', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  logger.info('Adding column name to Asset');
  await queryInterface.addColumn('Asset', 'name', { type: DataTypes.STRING });

  logger.info('Adding unique constraint UniqueAssetNameIndex to Asset');
  await queryInterface.addConstraint('Asset', {
    type: 'unique',
    fields: ['AppId', 'name'],
    name: 'UniqueAssetNameIndex',
  });

  logger.info('Adding column width to AppScreenshot');
  await queryInterface.addColumn('AppScreenshot', 'width', { type: DataTypes.INTEGER });

  logger.info('Adding column height to AppScreenshot');
  await queryInterface.addColumn('AppScreenshot', 'height', { type: DataTypes.INTEGER });

  logger.info('Adding column mime to AppScreenshot');
  await queryInterface.addColumn('AppScreenshot', 'mime', { type: DataTypes.STRING });

  const screenshots = await db.query<QueryResult>('Select id, screenshot from "AppScreenshot"', {
    type: QueryTypes.SELECT,
  });
  for (const { id, screenshot } of screenshots) {
    const img = sharp(screenshot);
    const { format, height, width } = await img.metadata();

    const mime = lookup(format);

    logger.info(`Adding metadata to AppScreenshot ${id}`);
    await db.query('UPDATE "AppScreenshot" SET mime = ?, width = ?, height = ? WHERE id = ?', {
      replacements: [mime, width, height, id],
      type: QueryTypes.UPDATE,
    });
    logger.info(`Successfully added metadata to AppScreenshot ${id}`);
  }

  logger.info('Making column width on AppScreenshot non nullable');
  await queryInterface.changeColumn('AppScreenshot', 'width', {
    type: DataTypes.INTEGER,
    allowNull: false,
  });

  logger.info('Making column height on AppScreenshot non nullable');
  await queryInterface.changeColumn('AppScreenshot', 'height', {
    type: DataTypes.INTEGER,
    allowNull: false,
  });

  logger.info('Making column mime on AppScreenshot non nullable');
  await queryInterface.changeColumn('AppScreenshot', 'mime', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

/**
 * Summary:
 * - Remove column `wildcardActions` from table `BlockVersion`.
 * - Remove column `mime` from table `AppScreenshot`.
 * - Remove column `height` from table `AppScreenshot`.
 * - Remove column `width` from table `AppScreenshot`.
 * - Remove column `name` from table `Asset`.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Removing column mime from AppScreenshot');
  await queryInterface.removeColumn('AppScreenshot', 'mime');

  logger.warn('Removing column height from AppScreenshot');
  await queryInterface.removeColumn('AppScreenshot', 'height');

  logger.warn('Removing column width from AppScreenshot');
  await queryInterface.removeColumn('AppScreenshot', 'width');

  logger.info('Removing unique constraint UniqueAssetNameIndex from Asset');
  await queryInterface.removeConstraint('Asset', 'UniqueAssetNameIndex');

  logger.warn('Removing column name from Asset');
  await queryInterface.removeColumn('Asset', 'name');

  logger.warn('Removing column wildcardActions from BlockVersion');
  await queryInterface.removeColumn('BlockVersion', 'wildcardActions');
}
