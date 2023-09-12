import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

import { convertUserToAppMember } from './utils.js';

export const key = '0.22.5';

/**
 * Summary:
 * Replacing UserId with AppMemberId in Asset
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  interface OldAsset {
    UserId: string;
    AppId: number;
  }

  logger.info('Adding column `Asset`.AppMemberId to `Asset`');
  await queryInterface.addColumn('Asset', 'AppMemberId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info("Add associated AppMemberId's to `Asset`.`AppMemberId`");
  const assets: OldAsset[] = (
    await db.query('SELECT "UserId", "AppId" FROM "Asset"')
  )[0] as OldAsset[];

  let assetError = false;
  for (const asset of assets) {
    try {
      const appMemberId = await convertUserToAppMember(db, asset.AppId, asset.UserId);
      if (appMemberId) {
        await db.query('UPDATE "Asset" SET "AppMemberId" = ? WHERE "UserId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [appMemberId, asset.UserId],
        });
      }
    } catch (error) {
      logger.error(error);
      assetError = true;
      continue;
    }
  }

  if (assetError) {
    throw new Error(
      'A problem occurred while migrating Asset Users to AppMembers. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    logger.warn('Removing column `UserId` from Asset');
    await queryInterface.removeConstraint('Asset', 'Asset_UserId_fkey');
    await queryInterface.removeColumn('Asset', 'UserId');
  }
}

/**
 * Summary:
 * Replacing AppMemberId with UserId in Asset
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  interface OldAsset {
    AppMemberId: string;
    UserId: string;
  }

  const assets: OldAsset[] = (
    await db.query(
      `
      SELECT a."AppMemberId", am."UserId"
      FROM "Asset" a
      RIGHT JOIN "AppMember" am ON am.id = a."AppMemberId"
      `,
    )
  )[0] as OldAsset[];

  logger.info('Adding column `Asset`.UserId to `Asset`');
  await queryInterface.addColumn('Asset', 'UserId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'User',
      key: 'id',
    },
  });

  logger.info("Add associated UserId's to `Asset`.`UserId`");
  let assetError = false;
  for (const asset of assets) {
    try {
      await db.query('UPDATE "Asset" SET "UserId" = ? WHERE "AppMemberId" = ?', {
        type: QueryTypes.UPDATE,
        replacements: [asset.UserId, asset.AppMemberId],
      });
    } catch (error) {
      logger.error(error);
      assetError = true;
      continue;
    }
  }

  if (assetError) {
    throw new Error(
      'A problem occurred while migrating Asset AppMembers to Users. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    logger.warn('Removing column `AppMemberId` from Asset');
    await queryInterface.removeConstraint('Asset', 'Asset_AppMemberId_fkey');
    await queryInterface.removeColumn('Asset', 'AppMemberId');
  }
}
