import { logger } from '@appsemble/node-utils';
import { type AppDefinition } from '@appsemble/types';
import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

import { convertUserToAppMember } from './utils.js';
import { AppMember, TeamMember } from '../models/index.js';

export const key = '0.22.5';

/**
 * Summary:
 * - Replaces UserId with AppMemberId in Asset
 * - Replaces UserId with AppMemberId in TeamMember
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // ### Asset

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

  // ### TeamMember

  interface OldTeamMember {
    UserId: string;
    AppId: number;
    definition: AppDefinition;
    // User properties
    name?: string;
    primaryEmail?: string;
    locale?: string;
    timezone?: string;
    emailVerified?: boolean;
  }

  logger.info('Add column `AppMemberId` in TeamMember');
  await queryInterface.addColumn('TeamMember', 'AppMemberId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info("Add associated AppMemberId's to `TeamMember`.`AppMemberId`");
  const teamMembers: OldTeamMember[] = (
    await db.query(
      `
      SELECT tm."UserId", t."AppId", a.definition, u.name, u."primaryEmail", u.locale, u.timezone, ea.verified AS "emailVerified"
      FROM "TeamMember" tm
      JOIN "Team" t ON tm."TeamId" = t.id
      JOIN "App" a ON t."AppId" = a.id
      JOIN "User" u ON tm."UserId" = u.id
      LEFT JOIN "EmailAuthorization" ea ON u.id = ea."UserId"
    `,
    )
  )[0] as unknown as OldTeamMember[];

  let migrationError = false;
  for (const teamMember of teamMembers) {
    try {
      const appMemberId = await convertUserToAppMember(db, teamMember.AppId, teamMember.UserId);

      if (appMemberId) {
        await db.query('UPDATE "TeamMember" SET "AppMemberId" = ? WHERE "UserId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [appMemberId, teamMember.UserId],
        });
      }
    } catch (error) {
      migrationError = true;
      logger.error(error);
      continue;
    }
  }

  if (migrationError) {
    throw new Error(
      'An error occurred during migration. Column `TeamMember.UserId` not removed to preserve old data.',
    );
  } else {
    await queryInterface.changeColumn('TeamMember', 'AppMemberId', {
      type: DataTypes.UUID,
      allowNull: false,
    });

    logger.warn('Removing column `UserId` from `TeamMember`');
    await queryInterface.removeConstraint('TeamMember', 'TeamMember_UserId_fkey');
    await queryInterface.removeColumn('TeamMember', 'UserId');
  }
}

/**
 * Summary:
 * - Replaces AppMemberId with UserId in Asset
 * - Replaces AppMemberId with UserId in TeamMember
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // ### Asset

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

  // ### TeamMember

  logger.info('Adding column `UserId` in TeamMember');
  await queryInterface.addColumn('TeamMember', 'UserId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'User',
      key: 'id',
    },
  });

  logger.info("Adding associated UserId's to `TeamMember`.`UserId`");
  const teamMembers = await TeamMember.findAll({
    include: [{ model: AppMember, attributes: ['UserId'] }],
    attributes: ['AppMemberId'],
  });

  let migrationError = false;
  for (const teamMember of teamMembers) {
    try {
      await db.query('UPDATE "TeamMember" SET "UserId" = ? WHERE "AppMemberId" = ?', {
        type: QueryTypes.UPDATE,
        replacements: [teamMember.AppMember.UserId, teamMember.AppMemberId],
      });
    } catch (error) {
      migrationError = true;
      logger.error(error);
      continue;
    }
  }

  if (migrationError) {
    throw new Error(
      'An error occurred during migration. Column `TeamMember.AppMemberId` not removed to preserve old data.',
    );
  } else {
    await queryInterface.changeColumn('TeamMember', 'UserId', {
      type: DataTypes.UUID,
      allowNull: false,
    });

    logger.warn('Removing column `AppMemberId` from `TeamMember`');
    await queryInterface.removeConstraint('TeamMember', 'TeamMember_AppMemberId_fkey');
    await queryInterface.removeColumn('TeamMember', 'AppMemberId');
  }
}
