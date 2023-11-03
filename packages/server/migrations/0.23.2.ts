import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

import { convertUserToAppMember } from './utils.js';

export const key = '0.23.2';

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

  // ### Resource
  interface DatabaseResource {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    User_AuthorId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    User_EditorId: string;
    AppId: number;
  }

  logger.info('Renaming column `Resource`.AuthorId to User_AuthorId');
  await queryInterface.removeConstraint('Resource', 'Resource_UserId_fkey');
  await queryInterface.renameColumn('Resource', 'AuthorId', 'User_AuthorId');

  logger.info('Renaming column `Resource`.EditorId to User_EditorId');
  await queryInterface.removeConstraint('Resource', 'Resource_EditorId_fkey');
  await queryInterface.renameColumn('Resource', 'EditorId', 'User_EditorId');

  const resources: DatabaseResource[] = (
    await db.query(`
      SELECT "User_AuthorId", "User_EditorId", "AppId"
      FROM "Resource"
    `)
  )[0] as DatabaseResource[];

  logger.info('Adding column `AuthorId` to Resource');
  await queryInterface.addColumn('Resource', 'AuthorId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info('Adding column `EditorId` to `Resource`');
  await queryInterface.addColumn('Resource', 'EditorId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info("Add associated AppMemberId's to `Resource`.`AppMemberId`");
  let resourceError = false;
  for (const resource of resources) {
    try {
      const newAuthor = await convertUserToAppMember(db, resource.AppId, resource.User_AuthorId);
      if (newAuthor) {
        await db.query('UPDATE "Resource" SET "AuthorId" = ? WHERE "User_AuthorId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [newAuthor, resource.User_AuthorId],
        });
      }

      const newEditor = await convertUserToAppMember(db, resource.AppId, resource.User_EditorId);
      if (newEditor) {
        await db.query('UPDATE "Resource" SET "EditorId" = ? WHERE "User_EditorId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [newEditor, resource.User_EditorId],
        });
      }
    } catch (error) {
      logger.error(error);
      resourceError = true;
      continue;
    }
  }

  if (resourceError) {
    logger.warn(
      'A problem occurred while migrating Resource Users to AppMembers. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    logger.warn('Removing columns `User_AuthorId` and `User_EditorId` from `Resource`');
    await queryInterface.removeColumn('Resource', 'User_AuthorId');
    await queryInterface.removeColumn('Resource', 'User_EditorId');
  }

  // ### Resource version
  interface OldResourceVersion {
    UserId: string;
    ResourceId: string;
    AppId: number;
  }

  const resourceVersions: OldResourceVersion[] = (
    await db.query(`
      SELECT rv."UserId", rv."ResourceId", r."AppId"
      FROM "ResourceVersion" rv
      RIGHT JOIN "Resource" r ON r.id = rv."ResourceId"
    `)
  )[0] as OldResourceVersion[];

  logger.info('Adding column `AppMemberId` to `ResourceVersion`');
  await queryInterface.addColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info("Add associated AppMemberId's to `ResourceVersion`.`AppMemberId`");
  let resourceVersionError = false;
  for (const resourceVersion of resourceVersions) {
    try {
      const appMember = await convertUserToAppMember(
        db,
        resourceVersion.AppId,
        resourceVersion.UserId,
      );
      if (appMember) {
        await db.query('UPDATE "ResourceVersion" SET "AppMemberId" = ? WHERE "UserId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [appMember, resourceVersion.UserId],
        });
      }
    } catch (error) {
      logger.error(error);
      resourceVersionError = true;
      continue;
    }
  }

  if (resourceVersionError) {
    logger.warn(
      'A problem occurred while migrating ResourceVersion Users to AppMembers. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
      type: DataTypes.UUID,
      allowNull: false,
    });

    logger.warn('Removing column `UserId` from ResourceVersion');
    await queryInterface.removeConstraint('ResourceVersion', 'ResourceVersion_UserId_fkey');
    await queryInterface.removeColumn('ResourceVersion', 'UserId');
  }
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
